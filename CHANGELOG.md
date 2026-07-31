# Changelog

Významné změny projektu jsou evidovány v tomto souboru ve formátu inspirovaném
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Kanonický visual update nyní bezpečně podporuje přidání nebo odebrání
  screenshot scénáře, sám synchronizuje metadata počtu baseline a po
  přegenerování znovu striktně ověří celé připnuté Playwright prostředí.
- Jednodenní celodenní událost se už kvůli implicitnímu UTC převodu
  exkluzivního data nezobrazuje v následujícím dni; jediný date-only adapter
  používá `start <= den < endExclusive` i přes DST.
- Vizuální baseline už nejsou závislé na Fedora/Ubuntu rasterizačním rozdílu:
  82 dotčených PNG bylo vědomě zkontrolováno a přegenerováno ve verzovaném
  Playwright 1.61.1/Noble prostředí bez uvolnění pixelové tolerance.
- Storybook a Playwright webServer už nenačítají aplikační Vite dev konfiguraci
  ani kořenový `.env`; shared/build/test config je oddělený od explicitně
  validovaného lokálního dev serveru a browser CI používá dostupný
  `LANG=C.UTF-8`.
- Kalendářní event color nyní prochází centralizovaným visual mapperem a
  podbarvuje celý block/surface v light i dark motivu místo pouze akcentu.
- Přepínač Celý den už nevyžaduje čas, používá explicitní DATE hranice a změna
  startu bezpečně posouvá neupravený nebo neplatný konec.
- Měsíční kalendář výchozím způsobem neskládá travel plan jako plnohodnotnou
  událost; zobrazuje kompaktní informaci a plný travel block ponechává dni/týdnu.
- One-shot migrace v API image používá správnou absolutně odvozenou cestu ke
  compiled secret resolveru a Prisma má ve finálním slim image OpenSSL, takže
  na read-only rootu nemusí doplňovat engine.
- Maintenance backup/restore běží jako neprivilegovaný runtime uživatel nad
  inicializovanými oprávněními volumes a čte pouze read-only runtime secrets.
- Produkční migrate image spouští lokální Prisma CLI bez Corepack runtime
  zápisu a funguje i s read-only root filesystemem.
- Caddy obsluhuje `/uploads/*` a `/internal/*` explicitními 404 před SPA
  fallbackem, takže runtime soubory ani interní health nejsou veřejné.
- Scheduling candidate expiry používá stejný injektovaný clock jako tvorba
  kandidáta, takže revalidace není závislá na aktuálním systémovém datu testu.
- Starší lokální `.env` bez limitů CSV importu znovu bezpečně nastartuje API;
  server použije stejné konzervativní limity jako kořenový `.env.example`.

### Added

- Federované celoaplikační hledání s osmi modulovými providery, českou
  `unaccent`/`pg_trgm` normalizací, společným rankingem, bezpečným POST
  kontraktem, provider timeouty a explicitním partial failure stavem.
- Adaptivní command palette v AppShellu s `Ctrl+K`/`Cmd+K`, přístupným
  combobox/listbox ovládáním, role-aware rychlými akcemi, validovanými
  workspace targety a lokálními recent položkami bez query, snippetů a
  finančních výsledků.

- Samostatný modul Výpravy s katalogem výbavy v celých gramech, household
  kategoriemi, Decimal množstvím, gearlist šablonami a date-only trekkingovými
  výpravami s více účastníky.
- Snapshotované seznamy výprav s rozlišením nesené, oblečené a spotřební
  hmotnosti, přidělením sdílené výbavy, cílovou base weight, kategoriálním a
  osobním rozpadem a deseti nejtěžšími položkami.
- Mobilní packing režim s optimistic rollbackem, filtry, hromadnými akcemi,
  vysvětlitelnou readiness kontrolou a post-trip hodnocením
  `USED`/`UNUSED`/`MISSING_DURING_TRIP`/`BROKEN`.
- Fotografie výbavy přes Documents public API, ruční upload a chráněný import
  HTTPS obrázku s DNS/IP SSRF kontrolou, limitem, ověřením MIME a odstraněním
  nebezpečných metadat; image search zůstává volitelný provider port.
- Výpravy na dashboardu a v globálním `Přidat`, bezpečný read-only search
  provider a explicitně potvrzované návrhy změn zdrojové šablony po návratu.
- Samostatný Meals modul s household recepty, normalizovaným katalogem
  surovin, ordered kroky, přesným Decimal scalingem a explicitními
  dokumentovými vazbami přes Documents public API.
- Date-only týdenní jídelníček s více účastníky, centrálním create/edit
  dialogem, potvrzenou kopií týdne, dashboardem a kompaktním Calendar summary.
- Sdílené nákupní seznamy s mobilním odškrtáváním, preview generováním,
  kompatibilní agregací `g ↔ kg`/`ml ↔ l`, source-link deduplikací a
  potvrzovaným odečtem jednoduchých pantry zásob.
- Samostatný modul Údržba domácnosti s kategoriemi, sdílenou date-only
  recurrence vrstvou, idempotentními výskyty, pozastavením, dokončením,
  přeskočením, přeplánováním, explicitními vazbami na úkoly, dokumenty a
  transakce, bezpečným dashboard modelem a šestihodinovým in-process
  generátorem chráněným databázovou unikátností.
- Workspace Údržba s přehledem, plány, historií a kategoriemi, adaptivním
  formulářem, globální akcí `Nový plán údržby` a kanonickými Storybook,
  accessibility a visual scénáři.
- Centrální calendar event draft/dialog pro toolbar, dvojklik na prázdný
  month den či day/week slot, homepage a globální `Přidat`, včetně klávesové
  alternativy a ochrany interaktivních eventů před propagací.
- Persistované sbalení desktopového sidebaru, oddělený homepage brand a
  samostatné ovladače `Sbalit hlavní menu` / `Rozbalit hlavní menu`.
- Kanonický digestovaný Playwright container, strojová baseline metadata,
  kontrola Chromium/fontů/locale/timezone/DPR a lokální
  `visual:check:container`/`visual:update:container` workflow.
- Oddělené povinné `Tests / Browser accessibility` a
  `Tests / Browser visual` joby s menším failure artifactem a nezměněnou GHCR
  publish branou.
- Reprodukovatelná CI/CD pipeline se šesti paralelními validačními joby,
  PostgreSQL migration testem, připnutým pnpm setupem, browser prostředím,
  izolovaným container smokem a GHCR publish branou.
- Centrální testovací public runtime config pro Vitest, Storybook a browser
  scénáře bez root `.env`, `VITE_API_URL` nebo produkčního Google Client ID.
- Lokální příkazy `ci:generate`, `ci:workflow`, `ci:check`, `ci:browser` a
  `ci:containers`, bezpečné failure artifacts a GitHub job summaries.
- Jediný registry manifest `deployment/images.json` a strukturální validace
  shody Compose image, workflow tag policy, oprávnění a dependency jobů.
- Aurora kalendářní tokeny pro osm barev, neutral/shared stavy a serverovou
  precedence explicitní event → jediný účastník → shared → neutral.
- All-day `allDayStartDate`/`allDayEndDateExclusive`, volitelný
  `desiredArrivalAt`, custom origin autocomplete a měsíční travel preference.
- Přímé ovládání Den/Týden/Měsíc, lokální selection mode a atomické bulk
  preview/update/delete s limitem 200 a zachováním Tasks/Templates.
- One-command deployment v `deployment/compose.yaml` nad hotovými GHCR API a
  gateway image, named volumes, idempotentním `volumes-init`, healthy databází
  a automatickou one-shot `prisma migrate deploy` bránou.
- GitHub Actions workflow s připnutými akcemi, povinným `pnpm check`, OCI
  metadaty a staging/release/commit-SHA tagy pro publikování obou image do GHCR.
- Veřejná runtime konfigurace webu generovaná gateway při startu, bezpečný error
  screen a backendový `*_FILE` resolver s předností Compose secret souborů.
- Kontejnerový maintenance profil pro logickou PostgreSQL a uploads zálohu,
  kontrolovanou obnovu a jednorázový `migrate-vps-data-to-volumes.sh` s
  dry-runem, checksumy a zachováním původních bind mountů.
- Runbooky pro registry, one-command start, aktualizaci, rollback image,
  backup/restore a migraci existujícího VPS.
- Single-VPS staging přes `compose.prod.yaml`: Caddy na 80/443, statický React
  build, interní nepublikované NestJS API/PostgreSQL, persistentní bind mounty,
  same-origin `/api/v1`, CSP a rotace container logů.
- Multi-stage API/gateway image, samostatný Prisma migrate target a volitelný
  responzivní `VITE_APP_ENV_LABEL` badge.
- VPS preflight/deploy/backup/restore skripty s dry-run, standardní zálohou před
  migrací, logical `pg_dump`, uploads archivem, manifestem/checksumy, retention
  a explicitně potvrzenou obnovou.
- Reprodukovatelný VPS runbook pro DNS, firewall, Google OAuth, první start,
  aktualizaci, logy, zálohy, obnovu a běžné provozní chyby.
- Sdílený roční Bucket list jako samostatný Nest/React feature modul s
  household/year unikátností, položkami, více účastníky, kategoriemi,
  prioritou, date-only cílem, místem, dokumenty a completion historií.
- Bucket list lifecycle `complete/reopen/skip/restore`, skutečný progress,
  dashboard widget a atomický rollover vybraných položek s novými UUID bez
  kopírování dokončovací historie.
- Finance Budgets se samostatným Nest/React feature modulem, měsíčními a
  kategoriálními limity v `BigInt` minor units, refund-aware čerpáním,
  celočíselným forecastem a kopírováním DRAFT nastavení do dalšího měsíce.
- Vysvětlitelný přehled „Kam mizí peníze“ s budget/trend/small-purchase/
  uncategorized/large-expense insighty, idempotentním evidence hash, bezpečným
  drill-downem a stavy Rozumím/Skrýt.
- Detekce a ruční potvrzení opakovaných plateb podle účtu, normalizovaného
  obchodníka, měny, podobné částky a intervalu; evidence není bankovní příkaz.
- Rozpočtový dashboard widget, adaptivní budget form, textové progress stavy,
  category/forecast a insight comparison grafy a syntetické light/dark
  Storybook, screenshot a accessibility scénáře.

- Finance CSV import s pětikrokovým wizardem, formátovou detekcí, ručním
  mapováním, importními profily, stránkovaným preview, deduplikací,
  idempotentním commitem a cleanupem dočasných souborů přes `StoragePort`.
- Kreditní účty s maskovaným identifikátorem, limitem, dluhem/dostupným
  limitem, refundy a kontrolovanou splátkou karty jako interním převodem.
- Prioritní pravidla kategorizace, normalizace obchodníků, automatické
  zařazení v importním preview a hromadná kategorizace ledgerových výdajů.
- Finance Analytics s category breakdownem, denním/měsíčním trendem, top
  obchodníky, porovnáním předchozího období, interním drill-downem a
  analytickým dashboard modelem po jednotlivých měnách.
- Finance Ledger Core se samostatným backend/frontend feature modulem, Prisma
  modely účtů, dvouúrovňových kategorií, transakcí, atomických převodů a
  dokumentových vazeb a nedestruktivní migrací.
- Přesný money model v `BigInt` minor units se string JSON DTO, českým parserem
  bez float, CZK/EUR oddělenými reporty a serverem odvozenými zůstatky.
- Finance workspace Přehled/Transakce/Účty/Kategorie, adaptivní create/edit a
  delete dialogy, filtrování/řazení/stránkování, přístupný date picker,
  periodický report s category breakdownem a veřejný dashboard widget.

- pnpm monorepo s React/Vite webem a modulárním NestJS API.
- PostgreSQL 18, Prisma ESM klient, první datový model a migrace.
- Google Identity Services login, serverové relace, CSRF a audit login/logout.
- Uživatelé, domácnosti, členství a chráněný responzivní dashboard.
- Globální deny-by-default access guard a interně chráněné health endpointy.
- Bezpečná lokální storage abstrakce a runtime adresáře `uploads/` a `database/`.
- Feature-oriented frontend, design tokeny, architektonická kontrola a testy.
- Verzovaná dokumentační vrstva, dokumentační rozcestník a automatická kontrola dokumentace.
- Originální responzivní základ s lokálním Inter fontem a sémantickými tokeny.
- Třírežimový AppShell pro telefon, tablet a desktop včetně bottom navigation, railu a sbalitelného sidebaru.
- Radix/shadcn-style UI primitives, Storybook 10, Chromium story testy, Playwright screenshot baselines a accessibility testy.
- Vlastní design systém HomeApp Aurora se system, light a dark motivem,
  pre-hydration ochranou proti flashnutí a ThemeSelectorem.
- Sémantické light/dark tokeny, kontrastní textové akcenty a Lucide BrandMark.
- Unit testy theme preference a rozšířené vizuální, reflow, reduced-motion a
  WCAG browser testy pro mobil, tablet a desktop.
- Document Core s Prisma modely `Document` a `DocumentFile`, nedestruktivní
  migrací, autentizovanými endpointy, rolemi a auditní stopou.
- Bezpečný multipart upload PDF/JPEG/PNG/TXT/DOCX/XLSX, SHA-256 checksum,
  kompenzační cleanup a streamovaný download přes `StoragePort`.
- Responzivní dokumentové stránky pro seznam, vytvoření a detail včetně
  metadat, archivace, obnovení a prázdných stavů bez demo dat.
- Document Library s logickými složkami, folder tree/sheetem, přesuny,
  hledáním, interními filtry, stránkováním 10/20/50/100, typovým registrem, JSONB
  metadaty, plain-text notes a samostatným preview/download workflow.
- Prisma modely `DocumentFolder`, `ExtractionJob`, `ExtractionResult` a
  `ExtractionFieldCandidate` v nedestruktivní migraci.
- Modulární `DocumentExtractionModule` s PDF text-layer adapterem, bezpečným
  timeoutem, normalizací českých dat a minor-unit částek a review UI pro
  přijetí, editaci nebo odmítnutí návrhů.
- Dokumentový prezentační model s typovými fallbacky, adaptivní preview/edit/move
  a lifecycle dialogy a samostatný pohled koše.
- Stavy `TRASHED`, původní složka koše a transakční
  `StoredFileDeletionTask` outbox s omezeným storage retry workerem.
- Layout-aware invoice extraction V2 s bloky a souřadnicemi, rekonstrukcí
  řádků/oblastí/tabulkových kandidátů, generic strategií, verzovaným supplier
  profilem, line items, purchase summary, cross-field validací a vysvětlitelnou
  confidence.
- Samostatné normalizátory data, peněz, měny, IČO, DIČ, účtu, IBAN, variabilního
  symbolu a čísla faktury a lokální `pnpm extraction:evaluate` quality nástroj.
- Samostatný Tasks modul s jednorázovými a recurring úkoly, prioritami,
  více účastníky, délkou, místem, kategoriemi, dokončovací historií a auditem.
- Explicitní `TaskDocument` vazby přes veřejný `DocumentsFacade`, interní filtry,
  adaptivní Tasks UI, quick create a dashboardový task widget.
- Typovaná workspace navigace se stálou `/app`, validovaným history/session
  stavem, Back/Forward, reload obnovou a feature-owned hosty/overlay.
- Single-household bootstrap, OWNER/MEMBER admission a read-only endpoint/UI
  členů bez invitations.
- Samostatný Calendar modul s ručními událostmi, účastníky, nočními směnami,
  timezone/DST policy, šablonami, transakčním bulk apply/rollback, Tasks
  feedem a dnešním dashboard widgetem.
- Samostatný `LocationModule` s geocoding/routing porty, backend-only Mapy.com
  Suggest/Geocoding/Route adaptery, bezpečnými timeouty, rate limitem a
  attribution bez cachování provider výsledků.
- Prisma modely `SavedPlace`, `CalendarUserPreference` a
  `CalendarEventTravelPlan`, strukturované event místo, default/custom/previous
  origin, serverový odjezd, rezerva, conflict a stale propagace.
- Adaptivní location/travel formuláře, plná editace události, read-only travel
  block, dashboardový odjezd a oddělené compact/medium/expanded view preference.
- Skutečný `DefaultPlaceAutocomplete`, sdílený cílový autocomplete, transientní
  participant-specific route preview a AUTO origin s fallbackem na výchozí
  místo každého účastníka.
- Osm serverem validovaných kalendářových barev členů, single/shared visual
  model a barevný picker v Nastavení.
- Přesné pracovní presety Denní 08–20, Noční 20–08, Ranní 08–14 a Odpolední
  14–20; noční preset zůstává jednou událostí přes půlnoc.
- Skutečný vertikální day/week calendar time-grid s 00:00–24:00 osou, all-day
  částí, current-time indikátorem, travel bloky, vizuálními nočními segmenty a
  deterministickým interval-partitioningem překryvů.
- `TaskParticipant`, `TaskCalendarLink` a calendar zdroj `TASK` v nedestruktivní
  migraci včetně partial unique ochrany jedné aktivní vazby na úkol.
- Samostatný `SchedulingModule` s průnikem dostupnosti, participant-specific
  cestami, nejvýše pěti HMAC podepsanými návrhy, revalidací a explicitním
  confirm/unschedule workflow.

### Changed

- Údržba domácnosti se v informační architektuře přesunula pod hlavní oblast
  Úkoly. Samostatná položka zmizela z desktopové, sbalené, tabletové i mobilní
  navigace; společný responzivní přepínač zpřístupňuje Úkoly/Údržbu a
  centralizovaný mapper udržuje Úkoly aktivní ve všech maintenance views.
  Maintenance backend, API, workspace historie, data, dashboard i globální
  quick create zůstávají samostatné a beze změny.
- Produkční web build je deployment-agnostický; Vite build/test už nevyžaduje
  build-time veřejné hodnoty a gateway je doplní až při startu.
- GHCR publish nyní na PR vůbec neběží, na `main` vytváří `staging` a SHA a
  release `vX.Y.Z` navíc vytváří `X.Y` a `X`; `packages: write` má pouze
  publish job po všech validačních branách.
- CORS konfigurace nyní explicitně povoluje také `PUT` a `DELETE`; browserový
  preflight už neblokuje smazání task-linked kalendářové události ani další
  existující mutace a regresi hlídá HTTP i architektonický test.
- Opravena regrese day/week time-gridu: vnitřní barevná event surface i
  focusovatelné tlačítko nyní vyplňují celou centrálně vypočtenou výšku; směna
  08:00–20:00 zůstává plným 720minutovým blokem a overlap layout se nemění.
- Opraven Tasks dashboard kontrakt registrací statické `/tasks/dashboard`
  routy před UUID detailem; widget rozlišuje error, retry a skutečný empty stav.
- Termín úkolu má explicitní date-only/timed/unscheduled model, přístupný český
  date picker s akcemi Dnes, Bez času a Vymazat termín a presety délky
  30/60/90/120 minut při zachování vlastního číselného vstupu.
- Cestovní blok používá přesně `departureAt` a `durationSeconds`; buffer je
  oddělená mezera před cílovou událostí a blok zobrazuje cíl i cestujícího.
- Kalendářní událost lze odstranit bezpečným soft-delete. U zdroje `TASK`
  zůstane původní úkol zachovaný, `TaskCalendarLink` se označí jako odstraněný a
  task lze znovu naplánovat; jednotlivé template eventy nemažou šablonu ani batch.
- Hromadné použití šablony používá skutečný český month grid Po–Ne, lokalizovaný
  název měsíce, navigaci měsíc/rok a správné skloňování počtu dnů.
- Scheduling rozděluje travel evaluation napříč všemi volnými intervaly, vrací
  bezpečné agregované diagnostics a nabízí recovery zítra, širší okno nebo
  kandidáty bez ověřené cesty s explicitním potvrzením.

- PostgreSQL data byla převedena z pojmenovaného volume na bind mount
  `database/postgres/` bez resetu databáze.
- Frontend a backend byly rozděleny do menších jednoúčelových modulů.
- Swagger byl vypnut a health endpointy byly přesunuty mimo veřejné API.
- Dashboard byl změněn na attention-first kompozici s pravdivými prázdnými stavy; ukázková data zůstávají pouze ve Storybook fixtures.
- Compose, NestJS, Prisma a Vite nyní používají jediný kořenový `.env` s
  bezpečnou expanzí `${VAR}`; duplicitní aplikační `.env.example` byly odstraněny.
- Backendový port byl zpřesněn na `API_PORT` a název CSRF cookie je společně
  konfigurovatelný přes `CSRF_COOKIE_NAME`.
- Původní světlý warm minimalistický směr byl nahrazen HomeApp Aurora; login,
  dashboard a všechny tři varianty AppShellu nyní používají stejné tokeny.
- Dashboard zobrazuje další business sekce jen tehdy, když má skutečná data.
- Dokumenty jsou aktivní v desktopové, tabletové i mobilní navigaci a rychlé
  přidání vede na skutečný upload formulář.
- Centrální API klient rozlišuje JSON a FormData, vynucuje timeout a podporuje
  bezpečný blob download s uvolněním object URL.
- Dokumentový klient synchronizuje stránkování, složku, hledání, typ, stav a
  řazení s URL; compact a desktop seznam jsou samostatné kompozice.
- Dokumentová knihovna používá compact seznam i v medium režimu do 1199 px a
  hromadné přijetí extrakce nepřepisuje existující ručně potvrzená metadata.
- Výchozí dokumentový seznam nyní upřednostňuje dodavatele, účel, referenci,
  datum, částku a složku; technické sloupce velikost a stav byly přesunuty mimo
  běžný seznam.
- Invoice metadata schema verze 2 přidává ručně editovatelný `purchaseSummary`
  a bezpečně validované `lineItems`.
- Dashboardová placeholder agenda byla nahrazena skutečným omezeným attention
  modelem; mobilní bottom navigation položka Úkoly nyní vede na funkční modul.
- Úkoly používají bezpečný výchozí pohled Vše pro všechny OPEN úkoly,
  serverové prioritní řazení a quick complete přes stejný use case.
- Uživatelský i interní feature název Agenda byl sjednocen na Úkoly/Tasks;
  fyzická tabulka zůstala přes Prisma mapování beze ztráty dat a starý workspace
  stav se bezpečně migruje.
- Browser router nyní vystavuje pouze `/login` a `/app`; feature názvy a UUID
  nejsou zapisované do URL, query ani hashe.
- Týdenní Calendar view vykresluje vícedenní a noční směnu jedním souvislým
  prvkem přes obsazené dny; mobilní týden ji neduplikuje.
- Nová událost i šablona mají odhad cesty výchozí zapnutý. Šablona může nést
  cíl, route mode a rezervu, ale nikdy konkrétní origin place nebo previous
  event; origin se vyhodnotí až při aplikaci.
- `SavedPlace` nadále uchovává uživatelem potvrzený popisek a adresní text, ale
  souřadnice/provider ID se z něj odstranily. Travel plan persistuje konfiguraci,
  ne route duration, distance, departure, geometry nebo provider response.
- Mobilní panel `Více` se po přechodu do interní oblasti řízeně zavře a vrátí
  přístup k nové workspace obrazovce.

### Security

- Nově inicializovaný PostgreSQL používá SCRAM pro host i local spojení;
  databázový port není publikovaný.
- Source secret soubory zůstávají `0600`; init služba připraví `0440`
  runtime kopie pro UID/GID aplikace a gateway k secret volume nemá přístup.
- Produkční runtime config vynucuje same-origin API cestu a odmítá neznámá
  pole, takže backendová tajemství nelze vložit do veřejného kontraktu.
- Aplikační endpointy jsou ve výchozím stavu autentizované.
- Jedinou veřejnou aplikační výjimkou je Google login.
- Upload root není veřejně publikován a storage odmítá nebezpečné cesty.
- Dokumentové storage klíče používají pouze serverové UUID segmenty, kontrolují
  symlink únik a nikdy se nevracejí v API response ani auditu.
- Household access vyžaduje aktivního uživatele, členství a odpovídající roli.
- Architecture check zakazuje hardcoded React barvy, paralelní theme provider,
  theme logiku v business stránkách, ne-namespacovaný storage a druhou ikonovou
  knihovnu.
- Architecture check hlídá document/extraction controllery, veřejné endpointy,
  filesystem mimo StoragePort, storage klíče v DTO a neschválené polymorfní
  document relations.
- Permanent delete je povolen jen z koše pro ADMIN/OWNER, audit zachová pouze
  document ID a typ a fyzický klíč se nevystavuje klientovi ani běžnému logu.
- Architecture check navíc vynucuje fáze extrakční pipeline, zakazuje metadata
  parsing v list komponentách a browserový `window.confirm` v Documents feature.
- Architecture check zakazuje feature browser routes, sessionStorage mimo
  workspace vrstvu, veřejný Calendar controller, monolitický CalendarService,
  paralelní Agenda modul, kopírování Task eventů a obcházení Calendar public API.
- Architecture check vynucuje default-place autocomplete, Mapy provider hranici,
  zákaz cache/persistence výsledků, template bez konkrétního originu, přesné
  směnové presety a barvy účastníků bez e-mailového odvozování.
- Scheduling architecture check zakazuje veřejný controller, přímé Prisma a
  provider adaptéry; confirm revaliduje verze a DB partial unique index chrání
  proti dvojitému vytvoření linked eventu.
