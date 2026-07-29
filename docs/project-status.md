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
více instancí.
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
- Majetek, vozidla, notifikační centrum a jídelníček.
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
  job po restartu nemá automatické obnovení, deletion outbox však zůstává v DB.
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

- `pnpm db:generate` — prošlo s Prisma 7.8.0.
- `pnpm db:migrate:deploy` — prošlo proti zachované lokální PostgreSQL
  databázi; všech 19 nedestruktivních migrací včetně
  `20260729120000_household_maintenance` je aplikováno bez resetu.
- `pnpm env:check` a `pnpm architecture:check` — prošly pro 288 produkčních
  TSX souborů, 46 centralizovaných environment proměnných a produkční
  i registry deployment kontrakt.
- `pnpm docs:check` — 0 lint chyb, 65 Markdown a 62 povinných dokumentů.
- `pnpm lint` — prošlo bez varování; `pnpm typecheck` prošlo pro API i web.
- `pnpm test` — API 399/399 a web 216/216 testů prošlo včetně čtyř
  konfiguračních boundary regresí.
- `pnpm storybook:test` — 94/94 Chromium story testů prošlo.
- `pnpm build` — NestJS i Vite build prošly; `pnpm storybook:build` prošel.
- `pnpm test:visual` — dva po sobě jdoucí kanonické běhy prošly 104/104
  (fontová metrika + 103 scénářů a 104 PNG baseline);
  sada pokrývá roční Bucket list a jeho dashboard na mobilu, tabletu
  a desktopu i finanční ledger, CSV importní review, kategorie a trend
  v light/dark režimu,
  rozpočtových stavů, dialogu, zjištění, opakovaných plateb a dashboard widgetu,
  výdajového formuláře na mobilu, tabletu a desktopu, přesné
  768px geometrie 720minutové směny, shodné výšky surface a click targetu,
  day/week překryvů, travel bloku s oddělenou rezervou, měsíčního template
  pickeru, task-linked delete dialogu, scheduling diagnostiky, date-only
  formuláře, duration presetů, barevného výběrového režimu kalendáře,
  all-day/custom-origin formuláře, bulk dialogů, dashboardového error/empty
  rozlišení a maintenance workflow/dashboardu na 390, 768, 1280 a 1440 px
  v light/dark režimu.
- `pnpm test:accessibility` — 76/76 axe, keyboard date-picker, focus, reflow,
  touch-target a reduced-motion testů prošlo; browser sada má celkem 180
  Playwright scénářů včetně kanonického fontového kontraktu.
- `pnpm format:check` a celý `pnpm check` prošly.
- Storybook dev i Playwright webServer nastartovaly s `CI=true`,
  `LANG=C.UTF-8` a bez aplikačních env hodnot; jednotlivé browser brány prošly
  94/94 Storybook, 76/76 accessibility a 104/104 visual testů.
- Produkční gateway Docker image se sestavil bez root `.env`; generický Vite
  build prošel kontrolou runtime-config scriptu, secret názvů a nepřítomnosti
  syntetického testovacího Google Client ID.
- `deployment/compose.yaml` i restore override prošly `docker compose config`.
  Lokální GHCR-compatible API/gateway image se sestavily; API běží jako UID
  10001 a oba image neobsahují source/test fixtures ani development server.
- Izolovaný one-command Compose smoke nad prázdnými named volumes prošel:
  `volumes-init` a `migrate` skončily 0, všech 19 migrací se aplikovalo, DB/API
  byly healthy a PostgreSQL host i local auth používají SCRAM. `/`, `/login` a
  `/app` vrátily 200, anonymní `/api/v1/auth/me` 401 a gateway odmítla
  `/uploads/*` i `/internal/*` odpovědí 404.
- Opakovaný `docker compose up -d` skončil s `No pending migrations`; DB i
  upload marker přežily `compose down` bez `-v`. Změna veřejného staging labelu
  aktualizovala `runtime-config.js` při shodném image digestu. Maintenance
  backup vytvořil dump/archive/manifest/checksumy a izolovaný restore vrátil DB
  i upload marker. Úmyslný migration exit 42 zabránil startu API.
- Workflow YAML prošlo Prettier parserem a projektovou kontrolou oprávnění,
  připnutých SHA, tagů a publish brány. Externí `actionlint` image nebyl spuštěn,
  protože bezpečnostní sandbox odmítl předání souboru třetímu image. Skutečné
  publikování do GHCR nebylo bez GitHub Actions credentials provedeno.
- Skutečný Nest/Vite dev smoke ověřil start obou aplikací, korektní propagaci
  `SIGINT`, web 200, chráněné `auth/me`, Bucket list, Tasks, Scheduling a
  Finance API 401 bez session, readiness 401 bez interního tokenu a readiness
  200 se správným lokálním tokenem proti PostgreSQL (`database: up`).
- Připnutý Chromium vizuálně ověřil time-grid, Tasks formulář, scheduling,
  responzivní CSV import a finanční analytické grafy na
  390×844, 768×1024, 1280×800 a 1440×900 v light/dark režimech: plný blok
  08:00–20:00, půldenní/noční segmenty, překryvy, current-time/travel block,
  date picker, date-only termín, presety délky a dashboard error/empty stav bez
  horizontálního overflow. Přihlášený stav používal deterministické syntetické
  Storybook/testovací fixtures, nikoli reálný Google účet.
- Mapy provider kontrakty prošly s mockem. Skutečný Mapy development klíč nebyl
  v prostředí dostupný, proto reálný provider smoke proveden nebyl.
- Browser smoke nebyl reálný Google login ani end-to-end databázový Tasks
  scénář přihlášeného uživatele. Reálný Google účet v tomto prostředí testován
  nebyl.
- `git status --short` byl před závěrečným reportem dostupný; změny neobsahují
  runtime data ani secret soubory. Kontejnerové lifecycle testy používají pouze
  izolované dočasné volumes a soubory v `/tmp`.

## Doporučený následující krok

Navázat samostatným notifikačním centrem nad serverově připravenými Tasks a
Calendar daty; nezavádět e-mailové/push notifikace ani externí calendar sync bez
samostatného návrhu a souhlasu.
