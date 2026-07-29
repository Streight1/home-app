# Datový model

Přesným zdrojem databázového schématu je
`apps/api/prisma/schema.prisma`. Tento dokument vysvětluje význam a bezpečnostní
dopady entit, nikoliv kopii všech atributů.

## User

Lokální účet uživatele. UUID je interní identifikátor; unikátní Google subject
je primární externí identita. E-mail je aktualizovatelný atribut a vstup
allowlistu, nikoliv primární identita. Status `DISABLED` okamžitě znemožní
použití existujících sessions.

## Household

Domácnost je hranice vlastnictví budoucích dokumentů, financí a dalších dat.
Samotná znalost UUID neopravňuje k přístupu.

## HouseholdMember

Vazba uživatele a domácnosti s rolí `OWNER`, `ADMIN`, `MEMBER` nebo `VIEWER`.
Kombinace `householdId` a `userId` je unikátní. Jeden uživatel může být členem
více domácností.

Smazání uživatele odstraní jeho členství; smazání domácnosti je při existujícím
členství omezené (`Restrict`). Toto chování brání náhodnému kaskádovému smazání
celé household hranice.

## SingleHouseholdBootstrap

Jeden stabilní záznam `primary` ukazuje na sdílenou domácnost. Unikátní FK
brání duplicitnímu bootstrapu a dovoluje bezpečně převzít existující ownerovu
jedinou domácnost bez hledání podle měnitelného názvu. Tabulka neukládá e-mail;
owner admission se validuje z kořenové konfigurace a uživatel zůstává
identifikovaný Google `sub`.

## Session

Revokovatelná serverová relace vlastní uživatele, čas expirace, poslední použití
a volitelné zneplatnění. Unikátní `tokenHash` je SHA-256 hash; raw token ani
Google ID token se v modelu nevyskytují. Smazání uživatele odstraní jeho sessions.

## AuditLog

Záznam bezpečnostní nebo doménové události s volitelným uživatelem, domácností,
entitou a JSON metadaty. Při smazání uživatele nebo domácnosti se reference
nastaví na null, aby auditní stopa zůstala zachována.

## Document

Dokument patří jedné domácnosti a volitelně logické `DocumentFolder`. Obsahuje
název, krátký popis, plain-text `notes`, typ, JSONB metadata a schema version,
provenance potvrzených extrakčních polí, datum bez času a stav
`ACTIVE`/`ARCHIVED`/`TRASHED`. `trashedAt`, `trashedByUserId` a
`trashedFromFolderId` zachovají vratný kontext koše. Trvalé smazání poskytuje
API pouze pro dokument v koši a pro administrátorskou roli.

Metadata validuje verzovaný registr: odmítá neznámé klíče a kontroluje datové
typy, délky, ISO datum, safe integer minor units a měnu. Indexy kombinují
household se složkou/stavem, typem a datem dokumentu.

## DocumentFile

Souborová metadata mají unikátní `documentId`, takže jeden dokument má v této
iteraci jeden aktivní soubor. Model obsahuje interní `storageKey`, původní a
sanitizovaný název, příponu, deklarovaný i detekovaný MIME, velikost, SHA-256,
uploadujícího uživatele a přípravnou verzi 1. Veřejné DTO nevrací interní klíč,
checksum ani cestu.

Vazby na dokument a uploadujícího uživatele používají `Restrict`. Storage objekt
se nevytváří ani nemaže databázovou kaskádou; konzistenci při vytvoření řídí
aplikační use case a při selhání databáze provede kompenzační odstranění.

## DocumentFolder

Logická adjacency-list složka vlastní household a volitelného rodiče; není
fyzickým adresářem v `uploads/`. Aplikace omezuje hloubku na 10, zakazuje cykly
a přesun přes household. `normalizedName` je unikátní mezi sourozenci a partial
index pokrývá kořenové složky. Mazání používá `Restrict` a projde jen pro
prázdnou složku; dokumenty se nikdy tiše nekaskádují.

## ExtractionJob, ExtractionResult a ExtractionFieldCandidate

`ExtractionJob` váže household, dokument a soubor k typu extrakce,
adapteru/verzi, schema verzi, žadateli, časům a bezpečnému error code. Stav je
`QUEUED`, `PROCESSING`, `REVIEW_REQUIRED`, `COMPLETED`, `FAILED` nebo
`CANCELLED`.

Jeden `ExtractionResult` drží omezený raw text a structured JSON. Kandidát
ukládá klíč pole, raw a normalizovanou JSON hodnotu, decimal confidence 0–1,
`confidenceReasonsJson`, stránku/text, `sourceRegionJson` se souřadnicemi a
review stav `PROPOSED`, `ACCEPTED`, `EDITED` nebo `REJECTED`.
Reviewer a čas jsou auditovatelné. Všechny vazby mají cizí klíče; generická
dokumentová polymorfní tabulka neexistuje.

## StoredFileDeletionTask

Interní outbox odděluje transakční odstranění dokumentových dat od fyzického
odstranění storage objektu. Ukládá interní klíč, stav `PENDING`, `PROCESSING`,
`COMPLETED` nebo `FAILED`, počet pokusů, bezpečný error code a časy. Klíč ani
task se nevrací klientovi. Worker provede omezený retry přes `StoragePort`.

## Task, účastníci a TaskCompletion

Prisma `Task` je kvůli nedestruktivnímu přejmenování mapovaný na fyzickou
tabulku `AgendaTask`. Patří jedné domácnosti a volitelně kategorii. Stav je
`OPEN`, `COMPLETED`, `CANCELLED` nebo `ARCHIVED`; priorita
`LOW`, `NORMAL`, `HIGH` nebo `URGENT`. Termín má tři explicitní stavy:
bez termínu; `dueDate` typu PostgreSQL `DATE` bez času; nebo `dueDate` s
`dueTimeMinutes` 0–1439 a serverem odvozeným `dueAt`. Date-only úkol nikdy
neukládá zobrazovanou půlnoc do `dueAt`. IANA timezone určuje převod časovaného
termínu a lokální hranice dne. Recurrence má frekvenci `NONE`, `DAILY`, `WEEKLY`,
`MONTHLY`, `YEARLY`, interval a frekvenčně omezená pole. Indexy podporují
household/stav/termín a kategorii. Odhadovaná délka je 5–1 440 minut. Místo je
buď potvrzené přes `locationPlaceId`, nebo pouze neroutovatelný
`locationLabel`/`locationNotes`.

`TaskParticipant` má kompozitní unikátní vazbu task/user a autora přidání.
Účastník je aktivní člen stejné domácnosti; migrace převedla původní
`assignedToUserId` bez ztráty dat. Zdroj pravdy pro nové zápisy je tato vazba.

`TaskCompletion` je append-only historie dokončených výskytů s
`occurrenceDueDate`, volitelnými minutami/instantem a uživatelem. U recurring
úkolu zůstává task otevřený a pouze se posune termín; historie se nemaže.
Date-only recurrence posouvá jen datum, časovaná recurrence zachová lokální čas
přes DST. Poznámka je plain text do 5 000 znaků.

## TaskCategory a TaskDocument

`TaskCategory` má v domácnosti unikátní `normalizedName`; `colorToken` je pouze
hodnota ze serverového allowlistu, nikoli CSS. Při smazání se `categoryId` úkolů
nastaví na null. `TaskDocument` má kompozitní klíč a skutečné cizí klíče na task,
dokument a autora vazby. Aplikační validace navíc vynucuje shodnou domácnost;
obecná polymorfní relation není použita.

## TaskCalendarLink

`TaskCalendarLink` je explicitní vazba mezi `Task` a `CalendarEvent` se
serverově odvozeným `householdId`, autorem, časem vytvoření, volitelným budoucím
`occurrenceDueAt` a `removedAt`. PostgreSQL partial unique index dovoluje
nejvýše jednu aktivní vazbu na task; souběžné potvrzení proto nevytvoří dva
eventy. Propojený event má `source=TASK`. Odebrání calendar plánu úkol nemaže,
ale nastaví linku `removedAt` a událost soft-delete.

## CalendarEvent, účastníci a šablony

`CalendarEvent` patří domácnosti. Časovaná událost ukládá UTC `startsAt` a
`endsAt`; celodenní událost je ukládá jako null a používá PostgreSQL DATE
`allDayStartDate` plus exkluzivní `allDayEndDateExclusive`. Volitelný
`desiredArrivalAt` je jediný časový cíl pro cestu k celodenní události. Dále
model drží původní IANA timezone, typ, stav, zdroj a nullable explicitní Aurora
color token. Nullable `deletedAt` a
`deletedByUserId` odlišují uživatelské odstranění od stavu `CANCELLED` a běžné
kalendářní query používají `deletedAt IS NULL`. `endsAt > startsAt`; noční či
vícedenní událost je jeden řádek. `CalendarEventParticipant` má skutečné FK na
event a household uživatele. WORK_SHIFT aplikační validace dovolí právě jednoho
účastníka, běžná událost více.

`CalendarTemplate` ukládá lokální časy, `endDayOffset`, potvrzený cíl,
`calculateTravel`, route mode a rezervu, nikoli předpočítané instanty ani
konkrétní origin. `CalendarTemplateParticipant` drží výchozí členy.
`CalendarTemplateApplicationBatch` zaznamená jednu transakční bulk operaci;
eventy na ni odkazují do ruční změny. Odkaz batch na později smazanou šablonu
je nullable, aby zůstala zachována bezpečná rollback historie. Jednotlivý
soft-deleted batch event zůstane připojený jako tombstone; rollback jej přeskočí
a nikdy neobnoví.

Task a Calendar záměrně nemají kopírovací tabulku ani polymorfní vazbu.
Nenaplánované termíny skládá feed za běhu přes explicitní source port; task s
aktivním `TaskCalendarLink` se zobrazí jen jako skutečný `TASK` event.

## SavedPlace, CalendarUserPreference a CalendarEventTravelPlan

`SavedPlace` patří household a může mít PRIVATE ownera nebo HOUSEHOLD
viditelnost. Ukládá pouze uživatelem potvrzený label, adresní text a provider
typ. Raw provider payload, provider ID ani souřadnice neukládá; souřadnice pro
konkrétní výpočet znovu řeší `GeocodingProviderPort`.

`CalendarEvent` má nullable FK `locationPlaceId`, bezpečný label snapshot a
plain-text poznámky. `CalendarUserPreference` je unikátní pro household/user a
odděluje compact, medium a expanded view spolu s default place, route, rezervou,
avoid flags a posledním účastníkem pracovní směny.

`CalendarEventTravelPlan` patří eventu i travelerovi a je unikátní jejich
kombinací. Explicitní FK rozlišují custom origin a previous event; režim AUTO
nemá konkrétní origin FK. Persistuje se konfigurace a stav, ne distance,
duration, departure, route geometry, input hash ani provider response. Travel
block nemá model a není persistovaným `CalendarEvent`; jeho konec se při
projekci odvodí jako `departureAt + durationSeconds`, nikoli jako začátek cílové
události.

`HouseholdMember.calendarColorToken` je serverem validovaný token z pevného
Aurora allowlistu. Události barvu člena nekopírují; response preferuje
explicitní `CalendarEvent.colorToken`, pak barvu jediného účastníka, `shared`
pro více účastníků a `neutral` fallback. `CalendarUserPreference` navíc drží
výchozí false pro plné travel bloky v měsíci.

## Finance ledger

`FinancialAccount` patří household, ukládá název, typ, ISO currency, opening
balance v `BigInt` minor units, date-only počáteční datum, Aurora color/icon a
archivaci. Částečný unikátní index chrání normalizovaný název aktivního účtu.
Aktuální zůstatek není sloupec: vzniká z opening balance a všech nesmazaných
ledgerových typů.

`FinancialCategory` je household strom s nullable parentem, kind
`EXPENSE`/`INCOME`/`BOTH`, serverem validovaným vzhledem a archivací. Databázový
unikátní index chrání aktivní jméno mezi sourozenci, aplikační vrstva hloubku
dvou úrovní a zákaz cyklu.

`FinancialTransaction` ukládá kladnou `BigInt` částku; znaménko je určeno typem
`EXPENSE`, `INCOME`, `REFUND`, `TRANSFER_OUT`, `TRANSFER_IN` nebo `ADJUSTMENT`. Měna musí
odpovídat účtu, `bookedDate` je PostgreSQL `DATE` a nullable `deletedAt` tvoří
soft-delete. Indexy pokrývají household/account/category + datum, transfer a
deleted stav.

`FinancialTransfer` propojuje dva účty stejné měny a obě ledgerové transakce.
Explicitní FK a atomická aplikační transakce brání polovičnímu převodu.
`FinancialTransactionDocument` je M:N join se skutečnými FK; Finance neukládá
document metadata ani storage key. Reporty nezahrnují transfery a nikdy
nesčítají různé měny.

Kreditní `FinancialAccount` má volitelný limit, den výpisu/splatnosti a pouze
maskovaný identifikátor. Záporný balance je dluh; refund jej snižuje a splátka
je stejný atomický transfer jako mezi ostatními účty.

`FinanceImportSession` vlastní životní cyklus dočasného souboru, detekovaný a
potvrzený formát, agregované počty a expiraci. `FinanceImportRow` drží jen
normalizovaná mapovaná pole, validační kódy, fingerprint a rozhodnutí uživatele;
raw CSV řádek se nepersistuje. `FinanceImportProfile` ukládá household mapping
bez původního souboru. Importní transakce mají unikátní `importRowId`, source
`CSV_IMPORT`, volitelné externí ID a fingerprint pro idempotenci.

`FinancialCategorizationRule` je household-scoped pravidlo s prioritou,
enabled stavem, bezpečným polem/operátorem, normalizovanou porovnávací hodnotou,
kategorií a volitelným omezením na účet nebo transakční typ. Původní bankovní
protistrana se nemění; normalizovaný obchodník je oddělené pole.

## Finance budgets, insighty a opakované výdaje

`FinancialBudget` patří household, drží jednu ISO měnu, date-only období,
volitelný celkový `BigInt` limit, DRAFT/ACTIVE/CLOSED/ARCHIVED stav a auditní
uživatele. Partial unique index dovolí jen jeden aktivní rozpočet stejné měny a
období. `FinancialBudgetAllocation` má unikátní budget/category pár, kladný
`BigInt` limit a warning threshold; FK nesmaže historickou kategorii kaskádou.

`SpendingInsight` ukládá bezpečný text, typ, severity/status, měnu/období,
validované JSON evidence bez raw bankovních údajů a unikátní household
`evidenceHash`. `lastDetectedAt` se při opakování posune, dismissed stejný hash
se neobnoví.

`RecurringExpenseCandidate` je household/account/merchant/currency vzor s
typickou `BigInt` částkou, intervalem, silou a počtem výskytů. Potvrzení založí
`RecurringExpense`; jde pouze o analytickou evidenci, nikoli bankovní příkaz.
Indexy pokrývají household/status, období, hash a merchant/currency. Všechny FK
mají explicitní delete chování a žádný model neukládá raw CSV nebo účetní číslo.

## Roční Bucket list

`YearlyBucketList` patří právě jedné domácnosti a kombinace
`householdId + year` je unikátní. Stav `DRAFT`, `ACTIVE`, `CLOSED` nebo
`ARCHIVED` popisuje lifecycle celého roku.

`BucketListItem` patří seznamu i domácnosti, má kategorii, prioritu,
`PLANNED/COMPLETED/SKIPPED`, volitelné date-only `targetDate`, aplikační
`SavedPlace`, textové poznámky a stabilní `sortOrder`. Původ a kopie rolloveru
jsou dvě strany self-relation; každá přenesená položka má nové UUID.

`BucketListItemParticipant` je explicitní M:N vazba na aktivního uživatele.
`BucketListItemDocument` je explicitní M:N vazba se skutečným FK na `Document`;
nevzniká generická polymorfní tabulka. `BucketListItemCompletion` uchovává
každé dokončení, datum, autora a krátkou plain-text poznámku. Reopen historii
nemaže.

## Údržba domácnosti

`MaintenancePlan` drží household plán, date-only `startsOn`, `endsOn` a
`nextDueOn`, validovanou JSON recurrence definici, strategii kotvy, odpovědnou
osobu, lead time, odhad délky a volitelnou výchozí cenu jako `BigInt` minor
units s měnou. Archivace a pozastavení jsou stavové operace.

`MaintenanceOccurrence` je konkrétní date-only výskyt. Dvojice
`maintenancePlanId + originalScheduledFor` je unikátní, takže opakované i
souběžné generování nevytváří duplicity. Přeplánování mění `scheduledFor`,
ale zachová původní datum; dokončení, přeskočení a zrušení zůstávají historií.

`MaintenanceTaskLink`, `MaintenanceOccurrenceDocument` a
`MaintenanceOccurrenceTransaction` jsou explicitní vazby se skutečnými FK.
Nevzniká polymorfní `entityType/entityId`. Dokumenty a transakce zůstávají
vlastnictvím svých modulů a Maintenance ukládá jen vztah a bezpečný typ vazby.

## Identifikátory a indexy

Doménové primární klíče jsou UUID. Unikátní podmínky chrání Google identitu,
household členství, session hash, jeden soubor na dokument, názvy sourozeneckých
složek, jeden result na job, jedno pole v resultu a interní storage klíč. Indexy
podporují dokumentové filtry, folder tree, job queue, termíny úkolů,
Calendar rozsahy/účastníky/templates, místa, preference, travel plány a audit
podle času.

Budoucí household entity musí obsahovat nebo bezpečně odvodit `householdId` a
každý dotaz je musí kombinovat s ověřeným členstvím aktuálního uživatele.
