# Backendová architektura

## NestJS moduly

`AppModule` skládá globální Config, Prisma a Storage infrastrukturu a doménové
moduly Auth, Users, Households, Audit, Documents, DocumentExtraction, Tasks,
Calendar, Location, Scheduling, Finance, BucketList a Health.
API je modulární monolit: moduly
sdílejí databázi, ale komunikují přes služby a dependency injection.

## Globální request pipeline

Guardy jsou registrované přes `APP_GUARD` v tomto pořadí:

1. throttling;
2. access policy;
3. přesná Origin kontrola;
4. CSRF kontrola.

Access guard výchozí endpoint nařídí jako `AUTHENTICATED`. Explicitní
`@PublicEndpoint()` je centrálně omezený na Google login. `@InternalEndpoint()`
používá interní health token místo user session.

## Controllery a služby

Controller mapuje HTTP na aplikační služby a bezpečná response DTO. Auth
controller nepracuje přímo s Prisma, Google knihovnou ani cookie detaily.

Auth service koordinuje verifier, household provisioning, session službu a
audit v databázové transakci. Session service vytváří, ověřuje a revokuje
relace. Cookie service nastavuje a čistí session a CSRF cookie. Google verifier
je implementací portu, takže testy nepoužívají skutečné Google servery.

Household provisioning v běžném režimu atomicky vytvoří prvního uživatele,
domácnost a OWNER členství. V single-household režimu používá stabilní
`SingleHouseholdBootstrap`: nakonfigurovaný owner převezme právě jednu bezpečně
určitelnou existující domácnost nebo ji založí; další allowlistovaný účet se
připojí jako MEMBER. Název není identifikátor a identita zůstává Google `sub`.
`HouseholdAccessService` je povinná hranice všech household dotazů a dávkového
ověření aktivních účastníků.

Documents modul odděluje presentation controllery a DTO, samostatné aplikační
use cases, doménový repository port a Prisma adaptér. Controller nepoužívá
Prisma ani storage. `CreateDocumentService` řeší členství a validaci,
`AttachDocumentFileService` storage zápis a kompenzaci a Prisma repository
atomicky vytváří metadata s auditem. Query služby vždy předávají repository
serverem odvozené `householdId`.

Documents modul dále odděluje folder use cases, listing, preview/download,
verzovaný registr typů a `DocumentsFacade`. Facade je veřejný vstup pro další
moduly a nevystavuje Prisma entity ani `storageKey`.

`DocumentListPresentationService` vlastní typová pravidla pro uživatelsky
srozumitelný seznam; React proto neparsuje metadata faktury. Lifecycle use cases
oddělují archivaci, koš, obnovu a permanent delete. Permanent delete transakčně
vytvoří `StoredFileDeletionTask`; samostatný worker dokončí storage cleanup s
omezeným retry a bez logování klíče.

`DocumentExtractionModule` vlastní samostatné fáze klasifikace, layout
extrakce, supplier profilů, kandidátů, line items, normalizace, cross-field
validace, confidence a review. `DocumentExtractorPort` odděluje use cases od
parseru; `ImageOcrPort` a vypnutý `StructuredAiExtractorPort` jsou konfigurační
hranice. PDF adapter mapuje raw `pdfjs-dist` položky do interních bloků s
page/x/y/width/height/order a layout analyzer skládá řádky, oblasti a tabulkové
kandidáty. Image adapter bezpečně hlásí `OCR_NOT_CONFIGURED`. In-process runner
vrací HTTP 202, používá timeout/abort a vždy zapíše finální stav; nejde o durable
queue.

Generický invoice extractor používá české/anglické labely a vzdálenost hodnot.
Verzovaný supplier profil se aktivuje jen při dostatečné shodě markerů. Dílčí
normalizátory a confidence služba jsou testovatelné bez Nest controlleru.
Lokální evaluator běží mimo produkční import workflow a neukládá zkoumaný
soubor do databáze ani repozitáře.

Tasks modul odděluje úkoly, categories, recurrence, dashboard query, mappery,
repository porty a Prisma adaptéry. Controllery jen mapují HTTP. Čistá
`CalculateNextOccurrenceService` počítá další termín nad IANA timezone a
injektovatelným `ClockPort`; repository výpočty recurrence neobsahuje.
`ResolveTaskScheduleService` odděleně validuje trojstavový termín a odvozuje
instant jen pro datum s časem; date-only listing porovnává PostgreSQL `DATE` s
lokálním dnem.
`TaskWriteValidationService` ověřuje všechny aktivní účastníky, household kategorii a
dokumenty dávkově přes veřejný `DocumentsFacade`. Jednorázové a recurring
dokončení spolu s historií a auditem probíhá transakčně. Dashboard dostává
omezený prezentační model z attention use case, nikoli Prisma záznamy.
Dashboard controller je statická route registrovaná před UUID detailem a jeho
DTO přijímá jen volitelnou timezone.
`TasksFacade` zveřejňuje planneru jen scheduling summary, household scope,
účastníky, délku, místo a stav aktivní calendar vazby.

Calendar modul odděluje event/template use cases, validační služby, mappery,
repository porty a feed sources. Ruční události se persistují jako
`CalendarEvent`; termíny úkolů poskytuje `TasksFacade` pouze read-only a
nevzniká jejich kopie. Šablona se převádí z lokálního data/času a IANA timezone
na instanty na serveru. Jarní neexistující čas se odmítne, podzimní dvojznačný
čas používá deterministicky dřívější offset. Bulk apply je jedna transakce a
batch rollback odmítne ručně upravené nebo odpojené události. Dashboard čte
omezený Calendar model přes vlastní use case.

`LocationModule` vlastní geocoding/routing provider porty, Mapy REST adaptery,
uložená uživatelsky potvrzená místa a kalendářové preference. `MapyApiClient`
není importovaný z Calendar modulu a posílá serverový klíč pouze v hlavičce.
Provider chyby mapuje na bezpečný kód bez logování dotazu, URL, souřadnic nebo
payloadu. Jednotlivé Suggest, Geocoding a Routing výsledky se necachují ani
nepersistují; potvrzený adresní text se před routingem znovu geokóduje.

Calendar travel oblast řeší AUTO policy po účastnících, cyklus, předchozí event,
odjezd, konflikt a stale propagaci v samostatných use case/repository typech.
Preview endpoint počítá transientní odhady a vrací jen bezpečný souhrn. Uložení
události je dokončené před externím routing requestem; chyba odhadu proto event
nevrátí zpět ani nezmění jeho časy. Feed odvozuje `TRAVEL_BLOCK` za běhu z
`CalendarEventTravelPlan`; route výsledek ani travel blok nepersistuje.

`SchedulingModule` je orchestrace nad `TasksFacade`,
`CalendarAvailabilityFacade`, `CalendarEventCreationFacade` a
`TravelEstimationFacade`. Nejprve čistě protne busy intervaly účastníků,
zaokrouhlí kandidáty na 15 minut a omezený travel budget rozdělí vyváženě mezi
všechny volné intervaly. Samostatný candidate evaluator buď ověří cesty, odmítne
skutečný konflikt, nebo zachová časově proveditelný návrh jako
`TRAVEL_NOT_VERIFIED`. Suggest vrací bezpečné agregované diagnostics a nikdy
nezapisuje. Confirm ověří HMAC token, jeho expiraci,
verzi tasku/kalendáře a stejné původní časové okno; jediná transakce pak vytvoří
`TASK` event a `TaskCalendarLink`. Partial unique index brání dvěma aktivním
vazbám při souběžném potvrzení. Provider odpovědi se persistently necachují.

Calendar repository používá soft-delete pro `MANUAL`, `TEMPLATE` i `TASK`
události. Task-linked odstranění v jedné transakci nastaví
`TaskCalendarLink.removedAt`, zneplatní travel plány a zachová Task. Feed,
availability a konfliktní dotazy odstraněné řádky filtrují.
`CalendarEventVisualService` vytváří bezpečný visual response bez klientského
parsování barev. All-day schedule validator odděluje DATE hranice od časovaných
instantů. Bulk preview/update/delete use cases ověřují celý household-scoped
výběr před jedinou repository transakcí; neúplný výběr neprovede nic.

`FinanceModule` odděluje pět HTTP controllerů, catalog/ledger/transfer/reporting
aplikační služby, čistá money a ledger pravidla a čtyři Prisma repository
adaptéry. Controller nepoužívá Prisma ani Documents internals. Všechny use case
nejprve odvodí household a minimální roli přes `HouseholdAccessService`;
dokumentové vazby ověřují výhradně veřejný `DocumentsFacade`.

Peněžní částka je v doméně a Prisma `BigInt`, veřejné DTO ji serializuje jako
decimal string minor units. Převod je jedna Prisma transakce, která vždy založí
nebo změní `FinancialTransfer`, `TRANSFER_OUT` a `TRANSFER_IN`; samostatné
smazání jedné strany ledger service odmítá. Reporting filtruje household,
date-only období a nesmazané řádky, ignoruje transfery v income/expense a
agreguje každou ISO měnu zvlášť.

`FinanceImportsModule` odděluje upload session, CSV parsing, mapování, profily,
deduplikaci, commit a cleanup. Přes `FinanceLedgerFacade` zapisuje ledger a přes
veřejnou `FinanceCategorizationFacade` pouze získá návrh kategorie; parser
neobsahuje kategorizační pravidla. Dočasný adaptér používá `StoragePort`.

`FinanceCategorizationModule` vlastní merchant normalizaci a prioritní první
shodu. `FinanceAnalyticsModule` provádí household-scoped read model nad
ledgerem. Převody jsou z dotazů vyloučené, refund je záporný výdaj, kreditní
nákup běžný výdaj a různé měny tvoří samostatné response skupiny.

`FinanceBudgetsModule` odděluje budget CRUD/summary, deterministické insighty,
recurring pattern detection a kompaktní dashboard. Cizí finance data čte pouze
přes `FinanceAnalyticsFacade`; controllery nepočítají forecast ani evidenci.
Money zůstává `BigInt`, forecast používá celé dny a integer division. Insight
hash dává idempotentní identitu a persistence zachovává dismissed stav. Dotazy
jsou vždy omezené householdem, obdobím a jednou měnou.

`BucketListModule` je samostatná hranice ročních household přání. Controllery
mapují list/item/lifecycle/rollover requesty; Prisma zůstává v malých
repository adaptérech. `BucketListInputValidationService` dávkově ověřuje
účastníky přes `HouseholdAccessService`, dokumenty přes veřejný
`DocumentsFacade` a místo přes veřejný `LocationFacade`. Dokončení, obnova a
audit jsou transakční. Rollover vytváří nové položky a explicitní self-relation,
nikdy nemění původní rok ani nekopíruje dokončovací historii. Dashboardový use
case používá injektovatelný clock a vrací pouze bezpečný read model.

## Prisma infrastruktura

Prisma klient je generován jako ESM a používá `@prisma/adapter-pg`. Prisma
service se připojuje a odpojuje v životním cyklu Nest aplikace. Přesné schema je
v `apps/api/prisma/schema.prisma`; význam entit popisuje
[datový model](data-model.md).

## Storage abstraction

`StoragePort` odděluje aplikační logiku od lokálního filesystemu.
`LocalFileStorageService` řeší validaci klíčů, limit velikosti, dočasný zápis,
atomické publikování, metadata, serverové adresářové scope, symlink kontrolu a
bezpečné odstranění. Dokumentový download načítá stream výhradně přes port;
uploads nejsou staticky publikované.

## Audit a chyby

Audit service zapisuje úspěšný login/logout, dokumentové, Tasks, Calendar,
finanční a Bucket list události. Databázové
mutace dokumentu a jejich audit jsou v jedné transakci. Audit downloadu je
best-effort a nesmí zablokovat stream. Audit nezapisuje tokeny, cookies,
storage klíče, obsah ani celý popis.

Globální exception filter vrací konzistentní `{ statusCode, code, message }`.
ValidationPipe transformuje DTO, povoluje pouze deklarovaná pole a odmítá
neočekávaná pole. JSON body má limit 32 KiB; multipart parser má samostatný
`MAX_UPLOAD_BYTES`, jeden soubor, sedm povolených multipart polí a paměťový
buffer omezený před aplikační validací.

## Konfigurace a bootstrap

Nest ConfigModule načítá jediný kořenový `.env` přes cestu odvozenou od modulu
a expanduje odkazy `${VAR}`. Zod schema validuje všechny backendem spotřebované
proměnné před startem. Prisma konfigurace načítá a expanduje stejný soubor,
takže databázové příkazy nezávisí na pracovním adresáři.
`main.ts` obsahuje pouze bootstrap, Helmet, JSON parser, cookie parser, CORS,
globální prefix/výjimky, validaci, error filter, shutdown hooks a listen.
Swagger není zapnutý.
