# Stav projektu

## Aktuální implementační fáze

Projekt má ověřený bezpečný základ modulárního monolitu: web, REST API,
PostgreSQL, Google přihlášení, serverové relace, domácnosti, audit, interní
health, lokální storage infrastrukturu a verzovanou dokumentační vrstvu s
automatickou kontrolou proti zastarávání. Aktuální produktový základ má
originální třírežimový design systém HomeApp Aurora, Storybook, system/light/dark
motiv a automatické browserové vizuální i accessibility kontroly. První
business oblast Dokumenty podporuje knihovnu se složkami, prezentačním
seznamem, adaptivními modály, archivem/košem, bezpečným permanent delete a
layout-aware extrakční review pipeline pro faktury s PDF textovou vrstvou.
Samostatné Úkoly nyní poskytují jednorázové a opakované úkoly, více účastníků,
délku, místo, tři explicitní stavy termínu, přístupný date picker, kategorie,
historii dokončení, dokumentové vazby a dashboard s explicitním API kontraktem.
Kalendář je oddělený modul pro události, přesné směnové presety,
centralizované event/participant/shared barvy, explicitní all-day DATE model,
kompaktní měsíční cestu, selection/bulk operace, timezone/DST šablony,
read-only task feed a skutečný day/week time-grid. Jediný event draft/dialog
obsluhuje toolbar, dvojklik na den či slot, homepage i globální Add; all-day
render používá date-only hranici bez implicitního UTC převodu. Scheduling navrhuje společné
sloty a vytváří `TASK` event
výhradně po explicitním potvrzení.
Samostatný location/travel modul přidává skutečný default-place autocomplete,
volitelné Mapy.com Suggest/Geocoding/Route, AUTO počátek po účastnících,
transientní preview, odjezd, konflikt, travel block a tři layoutové view
preference. Browser používá jedinou chráněnou `/app` workspace a
volitelný single-household režim připojuje allowlistované účty ke stejné
domácnosti.
Finance tvoří samostatný ruční household ledger s účty, dvouúrovňovými
kategoriemi, přesnými `BigInt` minor units, příjmy/výdaji, atomickými převody,
dokumentovými vazbami, zůstatky, CSV importem, pravidly kategorizace,
reportingem po měnách, měsíčními/kategoriálními rozpočty, vysvětlitelnými
insighty, evidencí opakovaných plateb a kompaktním dashboard widgetem.
Sdílený roční Bucket list je samostatný modul pro společná přání, více
účastníků, cílové datum a místo, dokumentové vazby, dokončovací historii,
progress, dashboard a explicitní rollover do dalšího roku.
Údržba domácnosti je samostatný modul pro jednorázové a opakované plány,
omezené idempotentní generování výskytů, navázané úkoly, dokončení,
přeskočení, přeplánování, historii, kategorie a explicitní vazby na dokumenty
a finanční transakce. Dashboard i globální `Přidat` používají veřejný
maintenance kontrakt a centrální dialog. Generování běží také při startu API
a v šestihodinovém in-process workeru; databázové unikátní klíče chrání souběh
více instancí. V uživatelské informační architektuře je Údržba sekundární
oblast pod hlavní položkou Úkoly; technický workspace, backend, API a data
zůstávají samostatné. Centrální mapper udržuje Úkoly aktivní na desktopu,
tabletu i telefonu a compact layout přepíná oblast bez horizontálního overflow.
Recepty, jídelníček a nákup tvoří samostatný Meals modul s household katalogem
surovin, Decimal množstvím, ordered recepty, date-only týdenním plánem a více
účastníky. Generování nákupu má read-only preview, slučuje jen kompatibilní
jednotky, chrání ruční položky source linky a pantry odečítá pouze po potvrzení.
Dashboard, kalendářní summary a globální `Přidat` používají veřejné kontrakty a
centrální dialogy pod `/app`.
Výpravy tvoří samostatný modul pro katalog outdoorové výbavy, opakovaně
použitelné gearlisty a konkrétní trekkingové výpravy. Hmotnost je uložená v
celých gramech, množství používá Decimal a výprava zachovává snapshot názvu,
kategorie a jednotkové hmotnosti. Mobilní packing režim, readiness přehled,
rozpad hmotnosti, rozdělení sdílené výbavy, vyhodnocení po návratu a návrhy změn
šablony zůstávají vysvětlitelné a vyžadují explicitní potvrzení. Fotografie
procházejí Documents veřejným rozhraním; import z HTTPS URL chrání SSRF,
velikost i skutečný typ obrázku a volitelné hledání je bez provideru poctivě
nedostupné.
Celoaplikační hledání nyní federuje read-only providery Documents, Tasks,
Maintenance, Calendar, Finance, BucketList, Meals a Expeditions. Command
palette je dostupná z desktopové i mobilní hlavičky a přes `Ctrl+K`/`Cmd+K`,
zachovává `/app`, používá existující create overlaye a validované detail
targety. Dotaz jde pouze v POST body, není auditovaný ani logovaný, response je
`private, no-store` a partial failure jedné domény nezneplatní ostatní
autorizované výsledky. PostgreSQL normalizace používá `unaccent`/`pg_trgm` a
nedestruktivní trigram indexy.
Stabilizační iterace doplnila měřitelný architektonický audit a reprodukovatelné
metriky. Search providery se skládají přes veřejné tokeny místo konkrétních
tříd, date-only a Decimal technická semantika má kanonické helpery, workspace a
overlaye se načítají po feature public entrypointech a cache invalidace používá
cílené query-key kontrakty. Finance CSV commit už neověřuje membership a
kategorii pro každý importovaný řádek, Finance Analytics sdílí jeden načtený
ledger kontext a document deletion outbox používá transakčně chráněný claim s
15minutovým crash-recovery lease podle databázového času, omezením pěti pokusů,
rolling-deploy guardem a ochranou proti zápisu opožděného workeru. Vznikly dvě
navazující nedestruktivní lease migrace; deployment model se nezměnil.
Projekt má také plně kontejnerový single-VPS staging. Reprodukovatelná CI
odděluje statické, API, web, browser accessibility, browser visual a container
joby, ověřuje migraci od prázdné PostgreSQL, runtime config bez `.env`,
kanonickou browser regresní sadu a izolovaný Compose stack včetně opakovaného
startu a selhání migrace. Teprve potom připravuje verzované API a gateway image
pro GHCR; deployment používá named volumes, one-shot inicializaci oprávnění
a automatickou `migrate deploy` bránu.
Generický Vite build, Vitest a Storybook používají environment-independent
shared config. Pouze explicitní aplikační dev server načítá kořenový `.env`;
Playwright Storybook webServer proto funguje i v čistém CI runneru a používá
stejnou syntetickou runtime fixture jako ostatní webové testy. Screenshoty
vznikají jen v digestem připnutém Playwright 1.61.1/Noble image s ověřeným
Chromiumem a lokálním Inter fontem.
Veřejná konfigurace webu vzniká až při startu gateway a tajemství lze předat
přes Compose secret soubory. Běžný start i staging aktualizace používají
`docker compose up -d`; záloha, obnova a nedestruktivní převod starých bind
mountů mají samostatné kontejnerové postupy. Skutečná doména, certifikát, běh
GitHub Actions a Google production login vyžadují cílové externí prostředí.

## Implementováno

- pnpm monorepo s React/Vite webem a NestJS API v TypeScript strict režimu.
- PostgreSQL 18 s bind-mounted PGDATA a Prisma ESM klientem.
- Google Identity Services popup a backendové ověření Google ID tokenu.
- Serverový e-mailový allowlist a identita založená na Google `sub`.
- Běžný nebo single-household provisioning se stabilním bootstrap pointerem;
  identity podle Google `sub`, nakonfigurovaný OWNER a ostatní MEMBER.
- Read-only členové domácnosti bez invitation workflow.
- Hashované, expirovatelné a revokovatelné serverové relace.
- Přesná Origin kontrola, CORS credentials, CSRF a login rate limiting.
- Centralizovaný CORS seznam zahrnuje všechny používané metody včetně
  `PUT`/`DELETE`; browserový preflight je krytý HTTP regresním testem.
- Globální deny-by-default access guard a interně chráněné health endpointy.
- Audit úspěšného přihlášení a odhlášení bez tajemství.
- `Document`, `DocumentFile` a `DocumentFolder` s UUID, logickým stromem do
  hloubky 10, typem, JSONB metadaty, notes a explicitními vazbami.
- Dokumentové endpointy pro upload, serverové stránkování 10/20/50/100,
  hledání, folder filtr, detail, update/move, archivaci, obnovení, preview a
  attachment download.
- Serverový prezentační model faktur/účtenek/smluv/záruk s dodavatelem,
  shrnutím, referencí, datem, částkou a role-based permissions; frontend
  neinterpretuje metadata JSON.
- Koš se zachováním původní složky, obnovení s fallbackem do kořene a permanent
  delete jen pro ADMIN/OWNER přes transakční `StoredFileDeletionTask` a retry
  worker.
- Serverem odvozená household hranice a role: VIEWER čte/stahuje, MEMBER a vyšší
  mohou mutovat.
- Validace PDF/JPEG/PNG/TXT/DOCX/XLSX podle MIME, přípony a obsahu, kompenzační
  cleanup po databázové chybě a audit bez interního storage klíče.
- Responzivní dokumentové routy s compact seznamem a folder sheetem,
  desktopovou tabulkou/stromem, dynamickým metadata formulářem a náhledem.
- `DocumentExtractionModule` s in-process job runnerem, layout-aware PDF
  bloky/řádky/oblasti/tabulkovými kandidáty, generic invoice strategií,
  verzovaným supplier profilem, line items, normalizátory, cross-field validací
  a vysvětlitelnou confidence; image OCR je poctivě nenakonfigurované.
- `ExtractionJob`, `ExtractionResult` a `ExtractionFieldCandidate` s confidence,
  zdrojem a potvrzovacím stavem; metadata se mění jen po potvrzení uživatelem.
- Hromadné přijetí extrakce vynechává pole s existující ručně potvrzenou
  hodnotou; její přepsání vyžaduje individuální akci.
- `MaintenancePlan`, `MaintenanceOccurrence`, `MaintenanceCategory` a
  explicitní task/document/transaction vazby s date-only termíny, minor units,
  rolovou autorizací a databázovou ochranou proti duplicitám.
- `Recipe`, `Ingredient`, `MealPlanEntry`, `ShoppingList`, `ShoppingListItem`
  a `PantryItem` s household scope, Decimal množstvím, date-only plánem,
  explicitními participants/source/document vazbami a kompatibilními jednotkami.
- `GearItem`, `PackTemplate`, `Trip` a jejich položky/účastníci s household
  scope, celočíselnými gramy, Decimal množstvím, date-only rozsahem, snapshoty,
  packing lifecycle, readiness potvrzeními a explicitními document/task
  vazbami.
- Workspace Výpravy s přehledem, výpravami, gearlisty a výbavou, centrálními
  create dialogy, editorem konkrétního seznamu, mobilním packing režimem,
  post-trip review, dashboard widgetem a globálními quick actions pod `/app`.
- Prisma `Task` bezpečně mapovaný na původní tabulku, `TaskParticipant`,
  `TaskCompletion`, `TaskCategory` a explicitní `TaskDocument` vazby s
  household scope, rolemi, prioritami, místem, délkou a IANA timezone.
- Denní, týdenní, měsíční a roční recurrence bez předgenerování výskytů;
  dokončení zachovává historii a recurring task posouvá na další termín.
- Termín úkolu jako PostgreSQL `DATE` plus volitelné minuty a odvozený instant;
  date-only úkol není zobrazovaný jako půlnoc a je opožděný až další místní den.
- Autentizované Tasks API s výchozím `all`, serverovým smart sortem,
  adaptivními formuláři, calendar pickerem, duration presety, quick create a
  bezpečným dashboard quick complete.
- Samostatné Calendar event/template/feed API, transakční bulk apply, batch
  rollback, čtyři přesné směnové presety, noční směna jako jeden event,
  explicitní event color precedence, all-day DATE hranice, selection/bulk
  update/delete, soft-delete všech zdrojů a dnešní dashboard widget.
  Task-linked delete zachovává Task a odstraňuje aktivní link.
- Vertikální 24hodinový day/week time-grid s all-day sekcí, current-time
  indikátorem, intervalovým overlap layoutem, travel bloky a vizuálními segmenty
  jediné noční/vícedenní entity; dlouhý event surface vyplňuje celou společně
  vypočtenou výšku positioneru.
- Samostatný Scheduling modul nad Tasks/Calendar/Location facades s
  15minutovými kandidáty, participant-specific cestami, krátkodobým podepsaným
  tokenem, revalidací a transakčním `TaskCalendarLink`. Diagnostika ukazuje
  volná okna a agregované důvody odmítnutí; kandidáty pro travel vyhodnocuje
  vyváženě napříč všemi intervaly a umí pokračovat bez ověřené cesty.
- `SavedPlace`, `CalendarUserPreference` a `CalendarEventTravelPlan` s PRIVATE
  scope, AUTO/default/custom/explicit previous origin, uživatelem potvrzeným
  adresním textem, serverovým odjezdem, konfliktem a stale propagací. Provider
  souřadnice ani route výsledky se nepersistují.
- Backend-only Mapy.com Suggest/Geocoding/Routing adaptery za porty, bezpečný
  timeout a response mapper, rate limiting, bez provider cache a s povinnou
  attribution komponentou.
- Plná adaptivní editace místa/cesty a účastníků, automatický route preview,
  read-only travel block přesně v `departureAt`, lokalizovaný měsíční bulk
  picker, dashboardový odjezd, member color picker a samostatně pamatovaný
  compact/medium/expanded Calendar view.
- Chráněné browser routy pouze `/login` a `/app`; interní workspace
  Back/Forward/reload stav neodhaluje feature ani UUID v URL.
- Centralizované Aurora light/dark tokeny, lokálně bundlovaný Inter a shadcn-style UI
  primitives nad Radix pro menu, dialog, sheet a tooltip.
- ThemeProvider s výchozím system režimem, živým sledováním OS, namespacovaným
  `homeapp.theme` storage a pre-hydration ochranou proti flashnutí.
- Samostatný compact shell s mobilním headerem a bottom navigation, medium rail
  a expanded sbalitelný sidebar s topbarem. Brand vede interně na dashboard,
  collapse má vlastní ovladač a lokální preference přežije reload bez změny
  `/app`.
- Attention-first dashboard v pořadí header, pozornost, rychlé akce a úkoly;
  další panely se bez reálných dat nevykreslují.
- Storybook 10 s foundations, component, shell a screen stories; fixtures jsou
  oddělené od produkčního kódu.
- Playwright baseline screenshoty pro čtyři viewporty a automatické WCAG,
  focus, 200% reflow, overflow a touch-target testy.
- Household access služba s kontrolou aktivního uživatele, členství a role.
- Bezpečná lokální storage abstrakce a ignorované runtime adresáře.
- Backendové, HTTP integrační, storage a frontendové komponentové testy.
- Architektonická kontrola velikostí, public endpointů, statických uploadů,
  theme hranic, hardcoded React barev, story fixture a ikonových knihoven.
- Strukturální CI kontrola pořadí pnpm/Prisma setupu, stabilních required
  jobů, publish oprávnění/tagů, image manifestu, Vite/Storybook hranic a
  izolovaného Compose modelu.
- Dokumentační rozcestník, architecture/feature/API dokumentace, runbooky a
  povinný Markdown lint s kontrolou odkazů, struktury a tajemství.
- Jediný kořenový `.env` pro Compose, NestJS, Prisma a Vite, bezpečná expanze
  `${VAR}` a automatická kontrola proti duplicitním nebo veřejným tajným hodnotám.
- `FinancialAccount`, `FinancialCategory`, `FinancialTransaction`,
  `FinancialTransfer` a `FinancialTransactionDocument` s household scope,
  date-only ledgerem, archivací/soft-delete, indexy a skutečnými FK.
- Samostatný Finance backend modul pro catalog, ledger, atomické převody a
  reporting; částky jsou `BigInt` minor units a API je vrací jako string.
- Finance workspace Přehled/Transakce/Účty/Kategorie při stále stejné `/app`,
  adaptivní formuláře a potvrzení, dokumentový picker a veřejný dashboard
  widget bez falešných dat či slučování CZK/EUR.
- Kreditní účet, refundy a splátka karty jako interní převod bez dvojího
  započtení do výdajů.
- Samostatný Finance Imports modul s detekcí CSV/Windows-1250, ručním
  mapováním, profily, preview, deduplikací, idempotentním commitem a cleanupem
  dočasných souborů přes `StoragePort`.
- Prioritní pravidla kategorizace, oddělená normalizace obchodníků, bulk
  zařazení a automatický návrh kategorie při importním preview.
- Finance Analytics endpointy a UI pro kategorie, denní/měsíční trend, top
  obchodníky, porovnání období a interní drill-down bez transferů.
- Finance Budgets s `FinancialBudget`/alokacemi, refund-aware čerpáním,
  integer forecastem, kopírováním období, idempotentními insighty a recurring
  kandidáty; workspace zůstává na jediné URL `/app`.
- Roční `YearlyBucketList` a položky s kategorií/prioritou, více účastníky,
  place/document vazbami, date-only cílem, complete/reopen/skip/restore,
  completion historií, progress, dashboardem a atomickým rolloverem.

## Částečně implementováno

- **Více domácností:** schema dál podporuje více členství, ale single-household
  UI nemá přepínač ani invitation/role management.
- **Dashboard:** responzivní shell, dokumentová rychlá akce a skutečné Tasks,
  Calendar a Finance widgety fungují; ostatní datové sekce bez business API zůstávají
  označené jako připravované.
- **Vytěžování:** layout-aware PDF text layer, fakturové line items a review
  fungují; OCR obrázků a durable queue nejsou nakonfigurované. Supplier profily
  pokrývají jen explicitně rozpoznané, verzované layouty.
- **Produkční provoz:** one-command single-VPS Compose, GHCR workflow, Caddy
  HTTPS/reverse proxy, neprivilegované API, automatická one-shot migrace,
  named volumes a kontejnerový backup/restore jsou implementované. Skutečné
  publikování workflow, centralizovaná observabilita a off-site transport záloh
  zůstávají provozní úkol.
- **Mapy.com:** kód a mockované provider kontrakty jsou hotové; skutečný
  development provider smoke vyžaduje vlastní klíč a v tomto workspace zatím
  nebyl proveden.

## Zatím neimplementováno

- OCR obrázků, štítky, fulltext obsahu, Office preview a verzování dokumentů.
- Přímé bankovní API, AI kategorizace a automatické fakturové párování.
- Majetek, vozidla a notifikační centrum.
- Pozvánky a změny rolí domácnosti.
- Výběr aktivní domácnosti uživatelem.
- Google Calendar, Gmail, Drive nebo jiné Google API integrace.
- Automaticky nainstalovaný backup scheduler a off-site replikace.
- Centralizovaná observabilita a automatický off-site transport záloh.

## Známá omezení

- Reálný Google login nebyl v tomto prostředí ověřen skutečným Client ID a
  interaktivním prohlížečem; automatické testy verifier mockují.
- Veřejný ACME certifikát, DNS, firewall a production Google origin lze ověřit
  až na cílovém VPS; lokální Compose smoke je neprokazuje.
- Nový publish workflow je lokálně strukturálně a kontejnerově ověřitelný, ale
  za skutečně proběhlý v GitHub Actions jej lze označit až po následujícím
  pushi a úspěšném běhu na GitHub runneru.
- Lokální úložiště je vhodné pro jeden server, ne pro horizontální škálování.
- Upload progress zobrazuje probíhající požadavek bez procent přenesených bajtů.
- Extraction job queue a storage deletion worker jsou in-process; extraction
  job po restartu nemá automatické obnovení. Deletion outbox zůstává v DB a
  osiřelý `PROCESSING` řádek lze po 15 minutách znovu bezpečně claimnout.
- PDF extrakce vyžaduje dostatečnou textovou vrstvu; image OCR vrací
  `OCR_NOT_CONFIGURED` a DOCX/XLSX se nevytěžují. Quality gate používá
  anonymizovanou syntetickou fakturu, nikoli skutečný uživatelský dokument.
- V single-household režimu se aktivní domácnost odvozuje ze stabilního
  bootstrapu; mimo něj zůstává první členství bez switcheru.
- Recurrence změna upravuje celou sérii do budoucna; výjimky jednotlivých
  výskytů, notifikace a Google Calendar synchronizace nejsou implementované.
- Chytré plánování v první verzi podporuje pouze neopakované úkoly a nikdy
  automaticky nepřesouvá existující událost; přeplánování je explicitní
  odebrání vazby a nové potvrzení.
- Kalendář nepodporuje drag-and-drop, externí synchronizaci ani výpočet
  odpracované doby a mzdy;
  podzimní DST ambiguity používá dřívější offset.
- Místa/cesty nepodporují veřejnou dopravu, route mapu, live polohu ani
  turn-by-turn navigaci; provider výsledky se záměrně necachují a ruční místo
  bez potvrzeného routovatelného cíle nemá routing.
- Workspace záměrně nepodporuje veřejné deep links na entity.
- Finance podporují CSV, nikoli přímé bankovní API; nemají kurzovou konverzi
  ani obnovení soft-deleted transakce. CSV parser drží v paměti pouze
  konfigurovaným limitem omezený soubor a není streamovaný pro neomezené vstupy.
- Interní health používá sdílený statický token; rotaci musí řešit provozní
  konfigurace.
- Vizuální baselines jsou vytvořené v připnutém Playwright/Noble containeru;
  cross-browser ani cloudové vizuální porovnání není zapojené.
- Mutable `staging` image usnadňuje aktualizaci, ale pro reprodukovatelný
  release je nutné použít release nebo commit-SHA tag; image rollback není
  databázový rollback.

## Poslední ověření

- `pnpm install --frozen-lockfile`, `pnpm db:generate` a Prisma validate —
  prošly; schema stále obsahuje 77 modelů a 65 enumů, nově má 24
  nedestruktivních migrací. Obě navazující outbox migrace prošly na existující
  lokální DB i od prázdné DB v izolovaném Compose stacku.
- `pnpm architecture:check`, `pnpm env:check`, `pnpm deployment:check`,
  `pnpm docs:check`, `pnpm ci:workflow` a `pnpm format:check` — prošly.
- `pnpm lint`, `pnpm typecheck` a plný `pnpm test` — prošly: 34 API souborů se
  469 testy a 32 web souborů s 272 testy. Document lifecycle zahrnuje atomický
  claim, crash recovery i ochranu claim tokenu; date-only HTTP regresní sada
  odmítá nemožná kalendářní data před zavoláním aplikační služby.
- `pnpm storybook:test` — 111/111 testů prošlo. Produkční API/Web build a
  `pnpm storybook:build` rovněž prošly.
- Aktuální audit eviduje 993 produkčních TS/TSX souborů, 68 spec souborů a 729
  statických test deklarací. `WorkspacePage` produkční chunk klesl z 694 285 B
  na 54 738 B díky feature lazy-loading; celý web `dist` vzrostl o 1,5 %.
- Kanonické browser testy prošly 116/116 visual a 96/96 accessibility scénáři
  bez změny baseline. Izolovaný `ci:containers` prošel za 54,04 s včetně čisté
  migrace, druhého startu, persistence a simulovaného selhání migrace. Finální
  image mají 210 167 877 B (API) a 24 770 526 B (gateway).
- Závěrečný `pnpm check` prošel za 378,79 s. Je o 52,22 s delší než výchozí
  baseline, převážně kvůli delšímu kanonickému visual/accessibility úseku a
  rozšířené regresní sadě; výsledek proto není prezentovaný jako zrychlení CI.
- Skutečné publikování do GHCR, VPS update, Google production login a Mapy
  provider smoke se v lokální stabilizační iteraci neprovádějí.

## Doporučený následující krok

Navázat samostatným notifikačním centrem nad serverově připravenými Tasks a
Calendar daty; nezavádět e-mailové/push notifikace ani externí calendar sync bez
samostatného návrhu a souhlasu.
