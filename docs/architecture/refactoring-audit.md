# Audit stabilizace architektury

Tento dokument zachycuje měřitelný stav před refaktorizací z 31. července
2026, nalezená rizika a rozsah bezpečných změn. Audit předchází změnám
produkčního chování. Časy jsou lokální wall-clock měření v aktuálním workspace;
nejsou vydávány za časy GitHub-hosted runneru.

## Rozsah a metoda

Audit zahrnul celé `apps/api/src/modules`, `apps/web/src/features`, Prisma
schéma a migrace, workspace navigaci, overlaye, dashboard, search providery,
runtime config, CI workflow, produkční Dockerfile a deployment Compose.

Použité zdroje měření:

- čistý `git status --short` před měřením;
- časovaný `pnpm check` bez změny zdrojového kódu;
- produkční build API a webu;
- lokální sestavení obou produkčních Docker image;
- reprodukovatelný `pnpm architecture:metrics` nad původním Git tree;
- počty souborů, řádků, testů, Prisma modelů a migrací;
- cílená kontrola repository query, cache invalidací, intervalových procesů,
  public facade a access policy.

Audit neobsahuje produkční telemetry ani reprezentativní produkční dataset.
Proto neoznačuje počet dashboard requestů nebo podezřelý query tvar za
prokázaný latency problém. Index nebo agregovaný endpoint se přidá až podle
měření konkrétního query plánu.

## Výchozí baseline

| Metrika                                |                      Před změnou |
| -------------------------------------- | -------------------------------: |
| `pnpm check`                           |                         326,57 s |
| API testy                              |  32 souborů / 446 testů / 2,15 s |
| Web testy                              |  26 souborů / 249 testů / 6,14 s |
| Storybook testy                        | 25 souborů / 111 testů / 10,55 s |
| Visual testy                           |    116 testů / přibližně 1,9 min |
| Accessibility testy                    |     96 testů / přibližně 2,4 min |
| `architecture:check`                   |                           0,92 s |
| `env:check`                            |                           1,01 s |
| `docs:check`                           |                           0,90 s |
| `deployment:check`                     |                           0,45 s |
| Prisma modely / enumy                  |                          77 / 65 |
| Prisma migrace                         |                               22 |
| Backend moduly / frontend features     |                          21 / 19 |
| Produkční TS/TSX soubory               |           980 (647 TS / 333 TSX) |
| Backend relative cross/deep importy    |                        373 / 267 |
| Frontend relative cross/deep importy   |                         121 / 54 |
| Architecture rule sites                |              204 v 1 947 řádcích |
| Produkční TSX sledované checkerem      |                              333 |
| Spec soubory / statické test deklarace |                         60 / 681 |
| Produkční TODO/FIXME                   |                                0 |
| Inline ESLint / TypeScript suppression |                            0 / 0 |
| API `dist`                             |        3 279 632 B / 579 souborů |
| Web `dist`                             |         1 620 105 B / 24 souborů |
| `WorkspacePage` chunk                  |       694 285 B / 170 031 B gzip |
| Hlavní web chunk                       |        283 313 B / 88 746 B gzip |
| API Docker image                       |                    210 164 460 B |
| Web/gateway Docker image               |                     24 751 735 B |

`pnpm check` prošel celý. Produkční build neobsahoval source mapy ani API
test/story soubory. Web build vydal oprávněné varování pro chunk nad 500 kB.

## Moduly a veřejné kontrakty

Backend obsahuje moduly `audit`, `auth`, `bucket-list`, `calendar`,
`document-extraction`, `documents`, `expeditions`, `finance`,
`finance-analytics`, `finance-budgets`, `finance-categorization`,
`finance-imports`, `health`, `households`, `location`, `maintenance`, `meals`,
`scheduling`, `search`, `tasks` a `users`.

Stabilní integrační kontrakty jsou zejména:

- `DocumentsFacade`;
- `TasksFacade`;
- `CalendarAvailabilityFacade` a `CalendarEventCreationFacade`;
- `FinanceLedgerFacade`, `FinanceCategorizationFacade` a
  `FinanceAnalyticsFacade`;
- `LocationFacade` a `TravelEstimationFacade`;
- `MaintenanceFacade`, `MealsFacade` a `ExpeditionsFacade`;
- společný `ApplicationSearchProvider` kontrakt.

Frontend má 19 feature adresářů, ale pouze 12 explicitních `*.public.ts`
entrypointů. Public entrypoint není požadovaný pro modul bez spotřebitele;
chybí však právě na několika aktivních cross-feature hranicích (`auth`,
`dashboard`, `global-search`, `scheduling` a část finance subfeatures).

## Importní graf a cykly

Reprodukovatelný statický graf, kde deep znamená relativní cross-boundary
import mimo public adresář, `*.public`, `*.facade` nebo cílový Nest module
entrypoint, našel:

- 373 backendových cross-module importů, z nich 267 hlubokých;
- 121 frontendových cross-feature importů, z nich 54 hlubokých;
- 38 importů z app/layout vrstvy do feature, z nich 37 přímo do interní cesty.

Potvrzené cykly:

- backend `auth ↔ households`;
- frontend `auth ↔ global-search`;
- frontend `calendar ↔ location`;
- frontend `tasks ↔ scheduling` a `tasks ↔ maintenance`;
- frontend `finance` obousměrně s analytics, budgets, categorization a imports.

Nejvýraznější konkrétní porušení je `SearchService`: orchestrátor zná společný
provider interface, ale konstruktor importuje osm konkrétních provider tříd z
interních cest domén. Calendar zase používá interní location služby namísto
jednoho úplného travel facade. Finance submoduly sdílejí několik interních
finance typů a policy helperů.

## Největší soubory a odpovědnosti

Největší produkční, negenerované soubory:

| Soubor                                | Řádků | Posouzení                                         |
| ------------------------------------- | ----: | ------------------------------------------------- |
| `trip-packing.service.ts`             |   579 | více use case; kandidát pro pozdější dělení       |
| `prisma-document.repository.ts`       |   515 | široký persistence adapter                        |
| `prisma-calendar-event.repository.ts` |   487 | široký persistence adapter                        |
| `pack-templates.service.ts`           |   421 | více command/query odpovědností                   |
| finance import session repository     |   416 | komplexní, ale jedna persistence oblast           |
| maintenance DTO                       |   402 | mnoho HTTP kontraktů v jednom souboru             |
| `finance-ledger.facade.ts`            |   400 | facade je širší než ideální public contract       |
| `workspace-storage.ts`                |   347 | dlouhý, ale soudržná bezpečnostní hranice         |
| `calendar.types.ts`                   |   316 | kandidát na rozdělení podle kontraktů             |
| `TripDialog.tsx`                      |   284 | soudržný formulář; samotná délka nestačí k dělení |

Audit proto nebude dělit soubory jen kvůli limitu. Prioritu mají soubory, které
současně autorizují, načítají, validují, zapisují a mapují několik use case.

## Skutečné duplicity a sdílené primitivy

### Date-only

Backend používá několik paralelních implementací: Tasks, Finance, Bucket list,
Maintenance a Calendar vytvářejí UTC půlnoc, zatímco Meals a Expeditions UTC
poledne. Serializace `toISOString().slice(0, 10)` je opakovaná v modulech i
search providerech. Recurrence má vlastní validní parser.

Frontend obdobně opakuje parsing, posun dne, začátek týdne a lokální datum v
Calendar, Tasks, Maintenance, Meals a Expeditions. Cílem je jeden
framework-independent date-only základ; doménové labely a recurrence policy
zůstávají ve vlastních modulech.

### Přesná čísla

Finance správně používá minor units, Gear celé gramy a Meals/Expeditions
decimal string/Decimal. Duplicitní je technická serializace Prisma Decimal a
regex množství v Meals a Expeditions. Ty lze sdílet, ale peníze, hmotnost,
čas a množství zůstanou oddělené doménové typy.

### Role a prezentační metadata

Frontend deklaruje shodný household role union ve více features. Metadatový
seznam quick-create akcí je duplikovaný mezi globálním `Přidat` a command
palette, přestože samotné dialogy a formuláře už správně sdílené jsou.

Tři document multi-pickery jsou si podobné; případná abstrakce musí patřit
Documents modulu a nesmí pohltit odlišnou cover/relation semantiku Recipe a
Gear fotografií.

## Error handling a autorizace

Pozitivní baseline:

- globální autentizační guard je deny-by-default;
- moduly běžně používají `HouseholdAccessService` a bezpečné 404;
- frontendový transport je centralizovaný v `apiClient`;
- produkční komponenty přímo nepoužívají `fetch`;
- search neloguje query text a vrací partial failure bez interní výjimky.

Dluh:

- doménové error-message helpery mají společný transportní základ, ale různé
  mapování; nelze je bezpečně sloučit jen podle názvu;
- hluboké cross-module importy policy a error typů ztěžují ověření hranic;
- chybí společná regresní sada, která pro každou cross-module UUID vazbu ověří
  cizí household a stejnou 404;
- VIEWER v globálním `Přidat` vidí create dokument akci, i když command palette
  ji správně skrývá a backend zápis odmítne.

## Workspace, overlaye a soukromí

Workspace navigation má jeden validovaný model, jediný History/sessionStorage
adapter, zachovává `/app` a centralizuje Back/Forward. Dvě konkrétní chyby:

1. Finance drill-down ukládá volný text `filters.query` do history state a
   sessionStorage. Protistrana nebo jiný citlivý finanční text tam nepatří.
2. Registry a overlay host staticky importují všechny workspace a dialogy.
   Router tedy lazy-loaduje jen celý `WorkspacePage`, nikoli jednotlivé oblasti.

Formuláře dashboardu, globálního Add a command palette nejsou kopie; používají
stejné overlay targety. `TaskCreateOverlay` však načítá stránku úkolů jen kvůli
členům domácnosti, což je nadbytečný request.

## Query keys a cache invalidace

Nalezené konkrétní problémy:

- unschedule úkolu volá `invalidateQueries()` bez key a refetchuje celý cache;
- Calendar a Scheduling invalidují neexistující `['dashboard']` key;
- packing checkbox invaliduje celý namespace Expeditions;
- shopping checkbox invaliduje celý namespace Meals;
- vytvoření maintenance/expedition tasku neinvaliduje cíleně Tasks;
- prezentační `CalendarEventItem` vlastní cross-feature invalidaci.

Modulové key factories existují jen částečně. Refaktor zavede explicitní
factories a mutation policies nejprve tam, kde je globální nebo neplatná
invalidace. Plošná invalidace všech query nebude nahrazena jinou plošnou
abstrakcí.

## Databázové dotazy a background procesy

Statický audit prokázal jeden konkrétní N+1 problém: CSV commit načte všechny
řádky, ale `FinanceLedgerFacade` pro každý řádek s kategorií znovu načte
membership a kategorii. Při limitu 100 000 řádků tak může před jedním
`createMany` vzniknout řádově až 200 000 čtení. Unikátní category ID lze ověřit
jedním household-scoped dotazem a zachovat stejné doménové validace.

Další potvrzené, ale rizikovější problémy:

- stored-file deletion outbox načte kandidáty a teprve potom je jednotlivě
  označí `PROCESSING`; dvě API repliky mohou claimnout stejnou práci;
- Finance Analytics načítá stejné aktuální ledger období třikrát a membership
  čtyřikrát pro jeden dashboard summary;
- Expeditions dashboard načte detail výpravy a následně jej přes summary use
  case načte znovu;
- recipe ingredient resolution provádí sekvenční find/upsert pro každou
  surovinu;
- finance import cleanup nemá batch limit ani atomický claim.

Stored-file worker má omezený batch a retry, Maintenance generátor databázovou
unikátnost a `skipDuplicates`. Intervaly uklízejí timer při shutdownu. Claim
outboxu se má opravit samostatně s concurrency integračním testem; improvizovaný
in-memory lock by nebyl bezpečný pro více replik.

Statický audit neprokázal nový index pro hlavní listy nebo dashboard, který by
bylo bezpečné přidat bez query plánu. Pozorované oblasti pro budoucí měření:

- dashboard používá osm paralelních modulových requestů;
- search spouští providery paralelně s timeoutem a limitem, což je správně;
- maintenance occurrence generator a cleanup workflow spoléhají na DB
  unikátnost/idempotenci a omezené dávky;
- repository adaptéry pro Calendar, Documents, Tasks a finance imports jsou
  široké a je nutné u nich měřit počet dotazů na reprezentativních datech;
- API CI ověřuje migrace proti PostgreSQL, ale aplikační Vitest používá mockované
  repository; hlavní Prisma query nemají systematickou integrační sadu.

Bez runtime query logu nelze osm requestů vydávat za N+1 ani přidat agregovaný
dashboard endpoint. Jediný přidaný index proto přímo podporuje novou doloženou
lease query deletion outboxu; nejde o spekulativní list/dashboard optimalizaci.

## Testy, CI a deployment

Nejpomalejší povinné vrstvy jsou kanonické visual a accessibility testy. Jejich
oddělené joby a publish dependency jsou správně. Monolitické frontendové spec
soubory (Calendar 940 řádků, Documents 860 řádků) zhoršují diagnostiku, nikoli
důvěryhodnost; scénáře se nesmí odstranit.

Každý izolovaný CI job oprávněně připravuje vlastní dependencies a Prisma tam,
kde kompiluje API. Container validation však po setupu používá jen Docker,
Bash a dependency-free Node helpery, takže hostitelský `pnpm install` je v něm
redundantní. Publikační build se zatím ponechá oddělený; promotion validovaného
OCI artefaktu by byla větší změna.

`.nvmrc` obsahuje jen major verzi `24`, zatímco Dockerfile používají
`24.18.0`. Patch verze se sjednotí bez změny runtime architektury.

## Accessibility a design system

Design tokeny, light/dark/system theme, Radix focus trap a 44px touch targety
mají dobrou baseline. Konkrétní search dluh:

- `Zobrazit vše` má `role=option`, ale není součástí keyboard option modelu;
- group headings ztrácejí sémantiku přes `role=presentation`;
- aktivní option se při šipkové navigaci neposouvá do viditelné části.

Tyto chyby lze opravit bez redesignu command palette.

## Dead code a zastaralá dokumentace

`DashboardPage.tsx` není v produkční router kompozici; duplikuje část staré
shell orchestrace, ale používá jej Storybook a natvrdo jej čte architecture
checker. Odstranění se odkládá, dokud bude nahrazen aktuálním story/public
kontraktem.

Project status a testing dokumentace před auditem uváděly 19 migrací, 288 TSX
a 104 visual baseline, zatímco skutečnost je 22, 333 a 116. Tyto údaje musí být
aktualizované nebo označené jako časově omezený snapshot.

## Prioritizace podle dopadu a rizika

### P0 — opravit v této iteraci

- odstranit finance free-text z persistovaného navigation state;
- dávkově ověřit unikátní finance category ID při CSV commitu;
- nahradit konkrétní Search provider závislosti public token kontrakty;
- odstranit globální/neexistující cache invalidace;
- lazy-loadovat workspace a aktivní overlay, poté znovu změřit bundle;
- sjednotit backend date-only a Decimal technické primitivy;
- připnout Node patch verzi a odstranit prokázaně redundantní CI setup;
- opravit tři potvrzené search accessibility chyby.

### P1 — připravit hranici, dokončovat po částech

- public entrypointy na app/feature hranici a dependency-graph guard;
- household role jako jeden frontendový public typ;
- Documents-owned multi-picker;
- cílené invalidace detail/list/dashboard pro packing, shopping a
  cross-module task creation;
- skutečné Prisma integrační testy pro nejrizikovější query.

### P2 — vědomě ponechat

- velké, ale soudržné formuláře a `workspace-storage.ts`;
- osm dashboard requestů bez latency/p95 důkazu;
- dělení širokých repository bez behaviorálního důvodu;
- OCI artifact promotion, pnpm store cache a agregovaný dashboard endpoint;
- společný cross-runtime Date-only balíček, který by přitáhl backendové
  závislosti do browseru;
- finance/calendar/location hlubší rozpojení, které vyžaduje širší facade API.

## Fázovaný plán

1. **Fáze A — audit:** tento dokument a baseline bez změny chování.
2. **Fáze B — společné základy:** date-only, Decimal, query keys, bezpečný
   navigation state, Node pin.
3. **Fáze C — modulární hranice:** Search provider tokeny, úzké frontend public
   entrypointy a lazy hosty/overlaye.
4. **Fáze D — výkon a CI:** změřený code split, cílené invalidace, odstranění
   redundantního container setupu; žádný spekulativní DB index.
5. **Fáze E — kontroly a dokumentace:** regresní testy, nové metriky,
   after-srovnání a aktualizace architektonických zdrojů pravdy.

Každá fáze musí projít cíleným typecheckem a testy před plnou pipeline.

## Konečné srovnání po cíleném refaktoru

Následující snapshot byl změřen stejným `architecture:metrics` skriptem nad
aktuálním stromem a aktuálním produkčním buildem. Časy jsou wall-clock lokálního
stroje; Docker image jsou výsledkem závěrečného `ci:containers` buildu pro
`linux/amd64`.

| Metrika                                |                      Před změnou |                  Po změně |
| -------------------------------------- | -------------------------------: | ------------------------: |
| `pnpm check`                           |                         326,57 s |                  378,79 s |
| API testy                              |  32 souborů / 446 testů / 2,15 s |    34 / 469 / 2,56 s wall |
| Web testy                              |  26 souborů / 249 testů / 6,14 s |    32 / 272 / 6,37 s wall |
| Storybook testy                        | 25 souborů / 111 testů / 10,55 s |        25 / 111 / 10,68 s |
| Visual testy                           |    116 testů / přibližně 1,9 min |   116 / přibližně 2,4 min |
| Accessibility testy                    |     96 testů / přibližně 2,4 min |    96 / přibližně 2,8 min |
| Prisma modely / enumy / migrace        |                     77 / 65 / 22 |              77 / 65 / 24 |
| Produkční TS/TSX soubory               |           980 (647 TS / 333 TSX) |    993 (658 TS / 335 TSX) |
| Backend relative cross/deep importy    |                        373 / 267 |                 365 / 259 |
| Frontend relative cross/deep importy   |                         121 / 54 |                  128 / 54 |
| Architecture rule sites                |              204 v 1 947 řádcích |       210 v 1 996 řádcích |
| Spec soubory / statické test deklarace |                         60 / 681 |                  68 / 729 |
| Produkční TODO/FIXME                   |                                0 |                         0 |
| Inline ESLint / TypeScript suppression |                            0 / 0 |                     0 / 0 |
| API `dist`                             |        3 279 632 B / 579 souborů | 3 293 293 B / 583 souborů |
| Web `dist`                             |         1 620 105 B / 24 souborů |  1 644 327 B / 61 souborů |
| `WorkspacePage` chunk                  |       694 285 B / 170 031 B gzip |  54 738 B / 15 121 B gzip |
| Hlavní web chunk                       |        283 313 B / 88 746 B gzip | 245 710 B / 77 364 B gzip |
| API Docker image                       |                    210 164 460 B |             210 167 877 B |
| Web/gateway Docker image               |                     24 751 735 B |              24 770 526 B |

Nárůst počtu webových build souborů je očekávaný důsledek rozdělení po
feature entrypointech, nikoli kopie aplikace. Počáteční workspace chunk klesl o
92,1 % raw a o 91,1 % gzip; hlavní chunk klesl přibližně o 13,3 % raw a
12,8 % gzip. Celkový web `dist` naopak vzrostl o 24 222 B (1,5 %) a API `dist`
o 13 661 B (0,4 %),
což je zde uvedeno bez vydávání za optimalizaci velikosti celého artefaktu.
API image vzrostl o 3 417 B a gateway image o 18 791 B. Závěrečný
`pnpm check` byl o 52,22 s (16,0 %) delší; rozdíl odpovídá zejména delšímu
kanonickému visual/accessibility úseku a osmi novým spec souborům, nikoli
prokázanému zrychlení CI.
Frontendový počet cross-feature importů vzrostl kvůli novým úzkým public
entrypointům, zatímco počet hlubokých importů zůstal 54; metrika tedy sama o
sobě nedokládá úplné rozpojení existujících feature cyklů.

## Skutečně provedené změny

- Search orchestrátor už neinjektuje osm konkrétních provider tříd. Moduly
  registrují `ApplicationSearchProvider` přes stabilní veřejné tokeny a Search
  skládá pouze společný kontrakt; pořadí providerů zůstává deterministické.
- Backendové date-only a Decimal helpery mají jeden technický zdroj pravdy.
  Frontend používá samostatný kanonický date-only helper bez implicitního UTC
  konstruktoru; vstupní DTO odmítají i kalendářně nemožné datum, nejen správný
  textový tvar. Doménové money, weight, duration a unit policy se nesloučily.
- Workspace registry a overlay host lazy-loadují úzké `*.public` entrypointy.
  Dashboard a create overlay úkolu dostaly feature-owned host, takže první
  `/app` bundle už staticky nenese všechny workspace a formuláře. Neúspěch
  starého deployment chunku má jednorázovou target-aware reload recovery;
  marker smaže pouze úspěch stejného import targetu a overlay při načítání drží
  nedismissible dialog.
- Finance free-text drill-down query se už nepersistuje do History ani
  sessionStorage. Starý uložený stav se načte kompatibilně, ale citlivý text se
  do další serializace nevrátí.
- Meals, Expeditions, Maintenance, Tasks a Calendar používají cílené query-key
  kontrakty. Odstraněná byla globální invalidace bez key i neexistující
  `['dashboard']` key; optimistic packing/shopping změny mají explicitní
  rollback.
- CSV commit ověřuje membership jednou a všechny unikátní kategorie jedním
  household-scoped dotazem místo membership/category čtení pro každý řádek.
- Finance dashboard analytika sdílí načtený kontext a ledger projekce; běžná
  cesta se snížila ze čtyř membership a čtyř ledger čtení na jedno a jedno.
- Stored-file deletion worker claimuje omezenou dávku transakčně a každý
  přechod chrání podmíněným update. Dvě instance proto nezpracují stejný outbox
  řádek jen na základě předchozího nezamčeného čtení. Nullable
  `processingStartedAt` přidává konzervativní 15minutový lease: osiřelý
  `PROCESSING` řádek lze po pádu převzít, ale opožděný worker bez shodného
  claim tokenu nemůže dokončit ani vrátit práci nového vlastníka do `FAILED`.
  Token i cutoff vycházejí z PostgreSQL času, takže clock skew API instancí
  lease nezkrátí ani neprodlouží. Pátý stale pokus se terminalizuje bez šestého
  claimu a rolling-deploy trigger doplní token i zápisu starší API verze.
  Scheduled wrapper zachytí také odmítnutí DB claimu nebo zápisu chyby, takže
  fire-and-forget běh nevytvoří unhandled promise rejection.
- Search keyboard model zahrnuje `Zobrazit vše`, group heading má sémantiku a
  aktivní option se posouvá do viewportu. VIEWER už v globálním Add nevidí
  create akce, které backend odmítne.
- Node je připnutý na `24.18.0` stejně jako produkční Dockerfile. Container CI
  stále ověřuje pnpm bootstrap, ale nepouští redundantní hostitelský install;
  samotný Docker build zůstává reprodukovatelný přes frozen lockfile.

## Vědomě ponechaný dluh po této iteraci

- Potvrzené cykly `auth ↔ households`, Calendar/Location a Finance subfeatures
  vyžadují širší změnu public facade; nebyly roztrženy riskantním hromadným
  přesunem.
- Široké repository a velké služby zůstaly beze změny, pokud audit neprokázal
  chybu odpovědnosti nebo měřitelný query problém. Samotný počet řádků nebyl
  důvodem k dělení.
- Osm paralelních dashboard requestů, další list/dashboard indexy a agregovaný
  dashboard endpoint zůstávají odložené do doby, kdy budou dostupné query
  plány nebo produkční latency metriky.
- Recipe ingredient resolution a finance-import cleanup vyžadují samostatný
  transakční návrh. Search timeout stále omezuje odpověď orchestrátoru, ale
  neumí zrušit už běžící Prisma dotaz.
- Vznikly dvě navazující nedestruktivní Prisma migrace:
  `20260731160000_stored_file_deletion_processing_lease` přidává nullable lease
  sloupec, bezpečný backfill a cílený index;
  `20260731163000_stored_file_deletion_mixed_version_guard` přidává kompatibilní
  trigger a druhý backfill pro rolling deploy. Modelů i enumů zůstalo 77/65 a
  žádná historická migrace nebyla odstraněna ani přepsána.

## Stav ověření stabilizační iterace

Po změnách prokazatelně prošly frozen install, Prisma generate/validate,
architecture, environment, deployment, documentation, workflow a format
kontroly, lint, typecheck, 469 API a 272 web testů, 111 Storybook testů,
produkční API/Web build a Storybook build. Kanonická sada prošla 116 visual a
96 accessibility scénáři bez změny baseline. Izolovaný container smoke z
prázdných named volumes aplikoval 24 migrací, prošel opakovaným startem a
persistencí a potvrdil, že chybná migrace zablokuje API. Závěrečný časovaný
`pnpm check` prošel za 378,79 s a `ci:containers` za 54,04 s.
