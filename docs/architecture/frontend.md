# Frontendová architektura

## Feature-oriented struktura

`apps/web/src` rozděluje aplikační kompozici, funkční oblasti, layout, UI a
technické utility:

- `app/` obsahuje router, providery, route guards, error boundary a typovanou
  workspace navigaci;
- `features/auth/` vlastní login, auth API, hooky a typy;
- `features/dashboard/` vlastní attention-first dashboard a view model;
- `features/documents/` vlastní API, query/mutation hooky, validační schema,
  responzivní komponenty, stránky a veřejnou route kompozici;
- `features/tasks/` vlastní úkoly, účastníky, kategorie, recurrence formuláře,
  dokumentový picker, workspace host a explicitní dashboard public API;
- `features/calendar/` vlastní kalendář, event dialogy, šablony, feed a
  explicitní dashboard public API;
- `features/scheduling/` vlastní návrhy slotů, explicitní potvrzení a správu
  aktivní calendar vazby přes veřejná feature rozhraní;
- `features/bucket-list/` vlastní roční seznam, položky, lifecycle dialogy,
  rollover, workspace host a explicitní dashboard public API;
- `features/theme/` vlastní typy, storage, DOM adapter, provider, hook a selector;
- `layouts/AppShell/` skládá tři responzivní navigační režimy;
- `components/ui/` obsahuje malé lokální primitives nad Radix;
- `lib/` obsahuje API klient, CSRF, API chyby a environment konfiguraci;
- `styles/` obsahuje globální styly a HomeApp Aurora tokeny;
- `stories/` a colocated stories obsahují pouze neprodukční data;
- `e2e/` obsahuje Playwright screenshot a accessibility testy.

## Bootstrap a App

`main.tsx` pouze načte globální styly, najde root a vykreslí `App` v
`StrictMode`. `App.tsx` skládá error boundary, providery a router. Ani jeden
soubor neobsahuje shell, obrazovku, API request nebo theme implementaci.

`AppProviders` skládá jediný `ThemeProvider`, Query provider a browser router.
Business stránky theme logiku neimplementují.

## Theme systém

`ThemeProvider` poskytuje zvolenou preferenci `system | light | dark`, skutečně
aktivní `light | dark`, změnu a reset. V system režimu udržuje živý
`matchMedia` listener, takže změna OS motivu nevyžaduje reload.
`themeStorage.ts` je jediný produkční přístup k localStorage a používá klíč
`homeapp.theme`.

Pre-hydration skript v `index.html` před prvním paintem validuje uloženou
hodnotu, vyhodnotí systémový motiv a nastaví `data-theme`,
`data-theme-preference`, `color-scheme` a meta `theme-color`. React adapter
udržuje stejný kontrakt. Autentizační data se lokálně neukládají.

## Router, workspace navigace a ochrana

`router.tsx` definuje pouze `/login`, `/app`, kořenové přesměrování a fallback.
Interní obrazovky Dokumentů, Úkolů, Kalendáře, Bucket listu a Nastavení používají
diskriminovaný `WorkspaceView`, area registry a feature-owned host komponenty.
`pushState`/`replaceState` drží viditelnou URL `/app`; Back/Forward obnovuje
view nebo důležitý overlay přes `popstate`. Reload načte nejprve bezpečně
validovaný `history.state`, potom `homeapp.workspace.navigation` v
sessionStorage a jinak dashboard. Logout oba stavy vymaže. Ukládají se jen
`area`, `screen`, `overlay.kind` a nutná UUID/data výběru, nikdy názvy, metadata,
tokeny ani obsah. Veřejné deep links na entity nejsou podporované.

Skrytí feature cesty není bezpečnostní mechanismus. Stránky se načítají lazy.
`AnonymousRoute` přesměruje přihlášeného z loginu;
`ProtectedRoute` před ověřením session nezobrazí chráněný obsah a při 401 vede
na login.

## Responzivní AppShell

Obsah se v DOM neduplikuje. CSS media queries mění pouze shell:

- compact `<768 px`: `MobileHeader`, jeden sloupec a bottom navigation;
- medium `768–1199 px`: 72px `TabletNavigationRail` a `AppTopBar`;
- expanded `≥1200 px`: 248px `DesktopSidebar`, sbalení na 72 px a 1440px obsah.

`HouseholdSwitcher`, připravené hledání, `QuickCreateButton` a `UserMenu` jsou
samostatné komponenty. Radix zajišťuje menu, dialog, sheet, tooltip a focus.
ThemeSelector je radio menu v user menu a radio group v mobilním sheetu Více.
Dokumenty jsou první aktivní business položka ve všech shell režimech; compact
layout renderuje kartový seznam, medium/expanded tabulku.

## Dashboard

`DashboardPage` vlastní auth/query napojení a skládá `DashboardView`. Produkce
předává prázdný model; další business panely se bez dat nevykreslí. Fixture
částky, dokumenty a termíny jsou jen v `src/stories/fixtures` a produkční kód je
neimportuje. Pořadí je header, attention, quick actions a úkoly.
Widget Úkoly importuje pouze `tasks.public.ts`; vlastní query a výpočet
opoždění zůstávají uvnitř Tasks feature.
Finance dashboard obdobně importuje pouze `finance.public.ts`; widget používá
vlastní `/finance/analytics/dashboard` hook a role-based quick actions, nikoli finance
repository nebo běžný transakční list.
Bucket list widget importuje jen `bucket-list.public.ts`, používá vlastní
`/bucket-lists/dashboard` model a quick complete volá stejný lifecycle endpoint
jako detail. Rok ani progress dashboard nedopočítává v Reactu.

## TanStack Query a API

`useCurrentUser` vlastní query `auth/me`; login a logout vlastní mutation hooky.
Document hooky vlastní list/detail, složky, typy, vytvoření, update, přesun,
archivaci, koš, obnovení, permanent delete, preview/download a extrakční joby a
po mutaci invalidují společný query namespace. Parametry knihovny drží interní
workspace state, nikoli viditelná URL.
Prezentační komponenty nevolají `fetch`. `lib/api/apiClient.ts` centralizuje URL,
JSON chyby, timeout, `credentials: "include"` a CSRF hlavičku. FormData nechává
browseru vytvořit multipart boundary. Blob download po použití uvolní object URL.

Tasks hooky vlastní list/detail/dashboard/kategorie a všechny mutace. List
drží view, stránku, page size, hledání a filtry v interním workspace stavu.
Výchozí `all` vrací všechny OPEN úkoly; dashboard používá explicitní public
widget/hook a stejný complete endpoint jako detail. Formulář skládá
samostatné sekce základních údajů, termínu, recurrence, přiřazení a dokumentů;
quick create používá stejné validační schema. Compact UI používá samostatné
mobilní karty a full-screen Dialog, medium/expanded kompaktní řádky.
Termín skládají malé `TaskDueDatePicker`, `TaskDueDateField` a quick-action
komponenty. Picker nepíše do URL, čas je volitelný a API payload obsahuje datum
a minuty, nikoli frontendem vytvořený instant. `TaskDurationPresets` pouze
nastavuje společné číselné pole a nikdy neodesílá formulář.

Bucket list hooky vlastní roční seznamy, detail položky, dashboard i všechny
lifecycle mutace. Filtry a rok jsou součástí validovaného workspace stavu nebo
lokálního feature stavu; URL zůstává `/app`. Formulář skládá základní údaje,
date-only cíl, účastníky, existující `PlaceAutocomplete` a veřejný document
picker. Compact karty a full-screen dialogy jsou samostatně navržené, ne
zmenšená tabulka.

Calendar feature dělí API/hooky, month/week/day/list komponenty, adaptivní
event dialogy, šablony a dashboard. React pouze formátuje response instanty;
lokální template časy, DST a konflikty vyhodnocuje server. Task položka ve
feedu naviguje zpět do Tasks workspace a quick complete volá jeho public API.
Day/week `time-grid` používá čisté výpočty segmentů a interval-partitioning;
00:00–24:00, all-day část, current-time line, travel bloky a sedm denních
sloupců nejsou odvozené z DOM měření. Jedna noční event entita má pouze dva
vizuální segmenty a překryvy se deterministicky skládají vedle sebe.
Top i výška pochází jen ze společného `time-grid.layout.ts`; event positioner,
surface a vnitřní button používají tutéž plnou výšku.
Location feature vlastní API/hooky, sdílený debounced combobox pro cíl i
výchozí místo, bezpečné provider stavy, route summary, atribuci a view
preference. Calendar form skládá účastníky, přesné směnové presety a
participant-specific transientní route preview; React dobu ani AUTO origin
nepočítá. React neposílá request na Mapy.com a nezná provider klíč.
`useRememberedCalendarView` vybírá compact/medium/expanded
serverovou hodnotu podle live media query; lokální cache drží pouze enum view.
Interní workspace navigation dál zachovává `/app` a neukládá adresu,
souřadnice ani názvy událostí. `CalendarTravelBlock` je read-only projekce a
kliknutí vede na detail cílové události. Jeho positioner používá serverové
`departureAt` a `durationSeconds`; cestovní buffer se nekreslí jako součást
bloku. Template manager používá lokalizovaný pondělím začínající month grid a
adaptivní delete dialog rozlišuje task-linked zdroj. Barvu a shared model přebírá ze
serverového calendar response, nikoli z e-mailu nebo klientského hashe.
`CalendarEventItem` mapuje serverový visual token na statický sémantický class
registr a barví celý surface. `EventScheduleFields` odděluje timed a all-day
hodnoty, uchovává ručně změněný konec a `EventTravelFields` pro all-day vyžádá
desired arrival pouze pro routing. Toolbar nabízí Den/Týden/Měsíc přímo.
Selection state zůstává jen v instanci CalendarPage; bulk dialogy používají
explicitní operace a žádné event ID nezapisují do URL.

Scheduling Dialog drží parametry a nejvýše pět serverových kandidátů. Ruší
zastaralý suggest request, automaticky nevybírá slot a před potvrzením nic
nekreslí ani nezapisuje do kalendáře. Diagnostický panel mapuje serverové
agregace na konkrétní recovery akce; neověřená cesta vyžaduje explicitní
potvrzení. Linked summary dovolí otevřít event,
explicitně odebrat vazbu nebo zahájit nové plánování; React nepočítá
dostupnost, cestu ani nový recurring termín.

Documents feature dělí `library`, `folders`, `forms`, `detail`, `preview`,
`modals` a `extraction` komponenty. Desktopový list renderuje výhradně serverový
`presentation` model; nemá technické sloupce velikost/stav. Compact layout má
samostatný mobilní list a folder sheet, medium/expanded tabulku a strom.

Preview, editace, move a lifecycle potvrzení používají sdílený adaptivní Dialog:
desktop má modal, compact full-screen variantu. Dirty edit otevře vlastní
potvrzovací dialog a nepoužívá `window.confirm`. Koš je samostatná route.
Extrakční review zobrazuje potvrzenou i navrženou hodnotu, confidence důvody a
zdrojovou oblast; na mobilu přepíná sekce a polling končí ve finálním stavu nebo
po bezpečném limitu.

Finance feature dělí `api`, `hooks`, `lib`, `types`, workspace navigaci a malé
overview/accounts/categories/transactions/forms/dashboard komponenty. Interní
state drží view, filtry, stránku a řazení při viditelné URL `/app`; detail se
vrací do stejného list state. Komponenty nevolají `fetch`. Sdílený `DatePicker`
používají Tasks i Finance a adaptivní Dialog se na compact šířce mění na
full-screen kompozici. Money helpery parsují český vstup řetězcově a používají
`BigInt`, takže žádný React výpočet částky nepoužívá float. CZK/EUR reporty se
renderují jako oddělené karty.

`finance-imports` vlastní pětikrokový adaptivní wizard, profil picker,
mapování, stránkované desktop/mobile preview a historii. `finance-categorization`
vlastní pravidla a veřejný bulk-category prvek. `finance-analytics` vlastní
API/hooky a grafické projekce; komponenty nikdy neagregují raw ledger. Drill-down
zapisuje pouze validovaný interní workspace filter a browser URL zůstává `/app`.

`finance-budgets` vlastní API/hooky, členěný create dialog, progress a
category/forecast graf, insight cards/comparison, recurring cards a veřejný
dashboard widget. Backend vrací hotový status, procenta, forecast a bezpečný
transaction filter; React je znovu nepočítá z raw ledgeru. Finance workspace
rozšiřují typované screens `budgets`, `insights` a `recurring` bez nové browser
routy nebo zápisu částek/evidence do navigation state.

Vite čte environment výhradně z kořene workspace a browseru vystavuje jen
schválené veřejné hodnoty. Theme preference není environment tajemství ani
autentizační stav.

## Design systém a Storybook

Kořenový `DESIGN.md` je zdroj pravdy HomeApp Aurora, `docs/design/` jeho
produktová aplikace a `styles/tokens.css` strojová implementace light/dark
tokenů. Inter je lokální open-source dependency. React komponenty nepoužívají
hardcoded barvy, paralelní theme provider ani jinou ikonovou knihovnu než
Lucide.

Storybook 10 není importovaný produkční aplikací. Addon Vitest spouští stories
v Chromium a addon a11y vynucuje WCAG. Storybook preview používá produkční
ThemeProvider s vypnutou persistencí. Playwright porovnává explicitní light a
dark baseline; mock GIS a fixture zůstávají v testovací vrstvě.
