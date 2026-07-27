# Trvalá pravidla projektu Life Admin

Tento soubor obsahuje závazná pravidla pro lidské i AI vývojové agenty.

## Povinné čtení před změnou

- Vždy přečti `AGENTS.md`, [dokumentační rozcestník](docs/README.md),
  [stav projektu](docs/project-status.md) a
  [Codex workflow](docs/development/codex-workflow.md).
- Přečti dokument příslušné feature v `docs/features/` a relevantní ADR.
- Při každé významné změně UI přečti celý `DESIGN.md` a
  [designový rozcestník](docs/design/README.md).
- Detailní standardy jsou v [coding standards](docs/development/coding-standards.md),
  [testing](docs/development/testing.md) a
  [documentation rules](docs/development/documentation-rules.md).

## Architektura monorepa

- Workspace spravuje pnpm. `apps/web` je React/Vite klient a `apps/api` je NestJS modulární monolit nad PostgreSQL a Prisma.
- Nové funkce se vytvářejí jako samostatné feature moduly. Nevytvářej předčasné moduly bez skutečného použití.
- Sdílej pouze stabilní technické utility; neslučuj nesouvisející domény do generických `utils.ts`, `types.ts` nebo `components.tsx`.
- Zachovej ESM, TypeScript strict mode a anglické názvy interních symbolů. Uživatelské texty jsou česky.

## Frontend

- `src/app` obsahuje kompozici aplikace, router, providery a route guards.
- Browser router smí vystavit pouze `/login`, `/app`, kořenový redirect a
  fallback. Feature obrazovky používají typovanou workspace navigaci pod
  stejnou URL; nevytvářej nové `/app/...` routy, query ani hash deep links.
- `history.state` a namespacovaný `sessionStorage` smí obsahovat pouze
  validovaný diskriminovaný navigační stav a nutná UUID. Přístup k History API
  nebo sessionStorage patří výhradně do `app/workspace-navigation`.
- `src/features/<feature>` vlastní stránky, komponenty, hooky, API funkce a typy dané oblasti.
- `src/layouts` skládá aplikační shell; `src/components/ui` obsahuje malé znovupoužitelné prezentační prvky; `src/lib` frameworkově nezávislou infrastrukturu.
- `App.tsx` nesmí obsahovat implementaci jednotlivých obrazovek. Smí pouze skládat providery a router.
- `main.tsx` smí obsahovat pouze bootstrap aplikace a načtení globálních stylů. Nesmí obsahovat routy, requesty ani stránky.
- Stránky mají skládat menší komponenty, nikoliv obsahovat všechnu logiku. Datové operace se nesmí provádět přímo v prezentačních komponentách.
- React komponenta má obvykle nejvýše 150 řádků; produkční TS/TSX soubor obvykle nejvýše 300 řádků. Delší soubor musí mít jedinou doložitelnou odpovědnost.
- Vizuální změny vycházejí z `DESIGN.md` a sémantických tokenů v `src/styles/tokens.css`. Nepoužívej proprietární assety ani náhodné hardcoded barvy.
- UI musí podporovat system, light a dark motiv. Nové komponenty musí používat
  sémantické design tokeny a nesmějí obsahovat nahodilé hardcoded barvy.
- Responzivní UI má samostatnou compact, medium a expanded kompozici. Nepoužívej
  jednorázové `window.innerWidth`; skrytá navigace nesmí zůstat ve focus nebo
  accessibility tree a touch target je nejméně 44 × 44 CSS px.
- Storybook fixtures patří pouze do story/test adresářů a produkční kód je nesmí
  importovat. Nevytvářej produkční design-preview route.

## Backend

- `src/modules` obsahuje doménové moduly a odděluje controllery, aplikační služby, DTO a adaptéry.
- `src/common` obsahuje access policy, bezpečné HTTP guardy, chyby a logging. `src/infrastructure` vlastní Prisma a storage implementace.
- Controller mapuje HTTP na aplikační služby; neobsahuje databázovou nebo tokenovou logiku. Externí integrace používají port/adaptér a dependency injection.
- Nový backendový controller je ve výchozím stavu chráněný autentizací. Globální access guard je deny-by-default.
- `@PublicEndpoint()` smí být použit pouze pro schválený `POST /api/v1/auth/google`. Health endpointy jsou `@InternalEndpoint()` a vyžadují interní token.
- Swagger není veřejný. CORS není autentizace a skrytý frontendový prvek není autorizace.

## Domácnosti a autorizace

- Každý přístup k datům domácnosti kontroluje členství uživatele přes `HouseholdAccessService`.
- Dotazy omezuj současně `householdId` a identitou aktuálního uživatele; podle operace také rolí.
- Neprozrazuj, zda cizí entita existuje. Chybějící a nepřístupná household data mají mít stejnou bezpečnou odpověď.
- Platná session sama o sobě neopravňuje k datům libovolné domácnosti.

## Runtime soubory

- Žádný obsah `uploads/` ani `database/` se necommituje; výjimkou jsou pouze `.gitkeep`.
- `database/postgres/` je aktivní datový adresář PostgreSQL. Neupravuj jej ručně, nemaž za běhu a nepoužívej jeho kopii jako zálohu; zálohy se dělají přes `pg_dump`.
- `uploads/` obsahuje pouze runtime soubory uživatelů. Žádný soubor z `uploads/` se neposkytuje přes veřejný static file server.
- Přístup k souborům vede výhradně přes storage port a budoucí autentizovaný controller s household autorizací.
- Fyzické názvy generuje server jako UUID. Uživatelské názvy jsou pouze metadata; odmítej absolutní cesty, `..` a únik z upload rootu.
- Dokumentový soubor se zapisuje a čte pouze přes `StoragePort`; `storageKey`
  ani filesystem cesta nesmí být součástí veřejného DTO nebo auditu.
- Testy dokumentových souborů používají dočasný root mimo skutečné `uploads/` a
  musí ověřit kompenzační cleanup po selhání databáze.
- Vytěžená data jsou vždy návrhy. Extrakční modul nesmí automaticky přepsat
  ručně potvrzená metadata; změna nastane jen po explicitním review a validaci.
- OCR a jiné externí zpracování patří za port/adaptér. Nenakonfigurovaný provider
  musí vrátit bezpečnou chybu a nikdy nesmí generovat falešný výsledek.
- Invoice extrakce musí zachovat layout bloky a oddělit klasifikaci, kandidáty,
  line items, normalizaci, cross-field validaci a confidence. Supplier profil se
  aktivuje jen při jisté shodě a test fixtures nesmějí obsahovat skutečné
  faktury ani osobní údaje.
- Archivace, koš a permanent delete jsou odlišné operace. Fyzické odstranění
  storage objektu probíhá přes transakčně vytvořený deletion outbox a omezený
  retry; `storageKey` se nesmí vracet klientovi ani logovat.
- Recurrence patří do čisté testovatelné doménové služby s injektovatelným
  ClockPort. React, controller ani Prisma repository nesmí počítat další výskyt.
- Finance rozpočty, forecast a insighty používají výhradně `BigInt` minor
  units a veřejné Finance facades; React neagreguje raw ledger. EXPENSE včetně
  kreditní karty se počítá, REFUND jej snižuje a transfery ani splátky karty se
  do výdajů nezapočítávají. Různé měny se bez explicitního kurzu nesčítají.
- Insight evidence musí být validovaná, vysvětlitelná a idempotentní; nesmí
  obsahovat raw bankovní řádky, čísla účtů nebo celé popisy transakcí a nesmí
  být prezentovaná jako finanční rada.
- Tasks smí přistupovat k dokumentům pouze přes explicitní veřejné rozhraní
  Documents modulu; vazby mezi doménami mají vlastní tabulku se skutečnými FK.
- Bucket list zůstává samostatný od Tasks. Rollover vytváří nové položky s
  novými UUID, zachovává původní rok a nekopíruje completion historii; vazby na
  členy, místa a dokumenty ověřuje jen přes veřejné modulové hranice.
- Finance ukládají peníze výhradně jako integer minor units (`BigInt`) a do JSON
  je mapují jako decimal string; frontend nesmí používat float. Převod je vždy
  atomický pár `TRANSFER_OUT`/`TRANSFER_IN`, různé měny se bez explicitní
  konverze nesčítají a dokumenty se ověřují jen přes `DocumentsFacade`.
- CSV import patří do samostatného `FinanceImportsModule`, dočasné soubory čte
  pouze přes `StoragePort` a po commit/cancel/expire je uklidí. Importní
  kategorizace smí volat jen veřejnou categorization facade. Analytics nikdy
  nezahrnují transfery ani splátku kreditní karty do výdajů, refund výdaj
  snižuje a různé měny se zobrazují odděleně.
- Kalendář je samostatný feature modul. Nenaplánovaný `Task` se do něj pouze
  agreguje přes read-only feed source; skutečný task event vzniká výhradně po
  explicitním potvrzení přes `TaskCalendarLink` a nesmí se ve feedu duplikovat.
  Timezone/DST výpočty a tvorba noční směny patří na backend; jedna směna přes
  půlnoc zůstává jednou persistovanou událostí.
- Scheduling je samostatný orchestrační modul nad `TasksFacade`,
  `CalendarAvailabilityFacade` a `TravelEstimationFacade`. Suggest nesmí měnit
  task ani kalendář, confirm vždy revaliduje dostupnost a klient nesmí počítat
  slot, cestu nebo recurrence. Provider odhady lze deduplikovat jen v rámci
  jednoho requestu, ne ukládat jako persistentní cache.
- Denní a týdenní kalendář používají čisté testovatelné time-grid výpočty;
  komponenta eventu nesmí počítat pozici nebo overlap a noční event zůstává
  jednou databázovou entitou s více vizuálními segmenty.
- Externí geocoding a routing patří výhradně do `LocationModule` za provider
  porty. Mapy API key nikdy nesmí mít `VITE_` prefix ani být dostupný Reactu;
  frontend volá jen autentizované HomeApp API a u provider dat zobrazuje
  `MapyAttribution`.
- Jednotlivé Mapy Suggest, Geocoding a Routing výsledky ani raw odpovědi
  necachuj a nepersistuj. Uložit lze jen uživatelem potvrzený aplikační popisek
  a adresní text v rozsahu dovoleném aktuálními podmínkami; před změnou této
  hranice znovu ověř oficiální dokumentaci. Kalendářní šablona smí držet cíl,
  ale nikdy konkrétní origin place, previous event nebo route výsledek.
- Přesná adresa a souřadnice se nesmějí ukládat do workspace navigation state
  ani lokální calendar view cache. Travel block je read-only projekce
  `CalendarEventTravelPlan`, nikoli persistovaný `CalendarEvent`. Čas odjezdu,
  conflict a stale propagaci počítá backend.

## Environment konfigurace

- Jediným lokálním konfiguračním souborem je kořenový `.env` vytvořený z
  `.env.example`. Nevytvářej ani nedokumentuj další `.env` v `apps/api` nebo
  `apps/web`.
- Samostatný registry deployment je jediná výjimka: používá
  `deployment/.env` z `deployment/.env.example` a neveřejné soubory v
  `deployment/secrets/`. Tento soubor je provozní konfigurace Compose balíčku,
  nikoli druhý aplikační `.env`.
- Compose, NestJS, Prisma i Vite musí číst kořenový zdroj. Odvozené hodnoty
  používej přes `${VAR}` a nezaváděj duplicitní porty, URL nebo Client ID.
- Do Vite konfigurace patří pouze veřejné hodnoty. Hesla, databázová URL,
  interní tokeny, session tokeny ani jiná tajemství nesmí mít prefix `VITE_`.
- Novou proměnnou přidej současně do kořenového `.env.example`, validace
  příslušného procesu, `pnpm environment:check`, testů a dokumentace lokálního
  vývoje.
- Single-household režim používá stabilní `SingleHouseholdBootstrap`, nikoli
  vyhledání podle názvu. Vlastník je určen normalizovaným nakonfigurovaným
  e-mailem pouze pro admission/počáteční roli; identita zůstává Google `sub`.
  Nevytvářej invitation controller ani app-level `.env`.

## Deployment

- Lokální `compose.yaml` a staging `compose.prod.yaml` mají odlišné účely;
  vývojovou konfiguraci nemaž ani nepoužívej jako veřejný deployment.
  `compose.prod.yaml` je zachovaná legacy cesta; hlavní one-command deployment
  je `deployment/compose.yaml` nad hotovými GHCR image bez `build:` sekcí.
- Ve staging/production smí host porty 80/443 publikovat pouze Caddy gateway.
  API ani PostgreSQL nesmějí mít host port a gateway nesmí mountovat uploads.
- Frontend se v production obsluhuje pouze jako statický build, API bez watch
  režimu pod neprivilegovaným uživatelem a Prisma migrace jednorázově přes
  `migrate deploy` před aktualizací API.
- Do image ani build argumentů nevkládej tajemství. Produkční frontend čte
  pouze validovaný allowlist z `window.__HOMEAPP_CONFIG__`; secret soubory
  používají `*_FILE`, nejsou v gateway a mají přednost před env fallbackem.
- Registry deployment používá named volumes, idempotentní `volumes-init`,
  healthy DB, one-shot `migrate` a start API jen po úspěšné migraci. Běžný
  start i staging update musí zůstat `docker compose up -d`.
- Před rizikovou migrací vytvoř logical PostgreSQL + uploads zálohu.
  Nepoužívej `down -v`, netaruj aktivní PGDATA a obnovu vždy ověř checksumy.
  Přechod z bind mountů nesmí smazat původní data.
- Změna deploymentu musí projít `pnpm deployment:check`,
  konfigurací legacy i `deployment/compose.yaml`, workflow lintem a pokud je
  Docker dostupný také buildem produkčních image, čistým named-volume startem,
  opakovaným `up`, persistence a izolovaným backup/restore smoke testem.

## Testy a dokončení

- Přidej jednotkové testy pro novou aplikační logiku a HTTP integrační testy pro access policy a bezpečnostní hranice.
- Externí Google služby se v testech vždy mockují. Testy nesmějí používat reálná tajemství nebo uživatelské soubory.
- S funkční změnou aktualizuj příslušnou feature dokumentaci, API katalog,
  bezpečnostní nebo datovou dokumentaci, `CHANGELOG.md`, `project-status.md` a
  případně roadmapu podle pravidel dokumentace.
- Před ukončením změny spusť minimálně `pnpm architecture:check`,
  `pnpm environment:check`, `pnpm docs:check`, relevantní cílené testy a
  nakonec povinně `pnpm check`.
  UI změna navíc vyžaduje Storybook build, Storybook browser testy, vizuální
  screenshot comparisons a accessibility testy.
- Před závěrečným reportem zkontroluj `git status --short` a ověř, že neobsahuje
  runtime data ani tajemství.
- Neoznačuj kontrolu jako úspěšnou, pokud nebyla skutečně spuštěna. Zachovej runtime data a nepoužívej destruktivní Git nebo databázové příkazy.
