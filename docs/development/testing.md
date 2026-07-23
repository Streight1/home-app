# Testování

## Testovací vrstvy

### Unit testy

Pokrývají služby a bezpečnostní adaptéry bez sítě. Backend testuje mockovaný
Google verifier, sessions, konfiguraci, household access, storage a dokumentové
use cases. Frontend testuje auth routy, HomeApp theme systém a dokumentové UI/API
adaptéry.

Document testy používají pouze generované PDF/JPEG bajty a dočasný storage root
z `tmpdir`; nikdy nesmějí zapisovat nebo mazat skutečný `uploads/`. Pokrývají
role, MIME/příponu/magic bytes, limit, checksum, kompenzační cleanup, household
scope, stavové přechody, download hlavičky, audit bez `storageKey`, compact UI,
multipart boundary a blob URL cleanup.

Document Library testy navíc pokrývají page size allowlist, interní list stav, folder
tree/cykly/hloubku, typový registr a notes. Extraction testy používají
vygenerované PDF se skutečnou textovou vrstvou a mockované porty pro timeout,
failure, household izolaci a review; nikdy nevolají OCR cloud.
Hromadné přijetí extrakce má regresní test, který chrání uživatelem potvrzená
metadata před přepsáním.

Tasks testy používají pevný `ClockPort`. Pokrývají denní interval a DST,
týdenní dny, 31. den kratšího měsíce, přestupný rok, konec série, transakční
completion historii, VIEWER zákaz mutací, více aktivních účastníků, délku,
místo, household kategorii a
dokumentové facade. Frontend pokrývá empty/error stav, interní filtry, quick create,
dynamická recurrence pole, role a mobilní seznam.
Regresní Tasks testy navíc ověřují, že statická `/tasks/dashboard` route není
zachycena UUID detailem, a pokrývají date-only/timed/unscheduled termín,
overdue hranici, date-only recurrence, date picker, Dnes/Bez času/vymazání a
duration presety 30/60/90/120 i vlastní hodnotu.

Calendar testy pokrývají noční směnu jako jeden event, template `endDayOffset`,
Europe/Prague DST gap/ambiguity, účastníky, konflikty, transakční bulk apply,
batch rollback, household feed izolaci a mapper bez citlivých dat. Frontend
ověřuje Month default, mobilní seznam, day/week time-grid pozice, intervalové
překryvy, noční segmenty, travel block, template picker, Tasks public navigation
a quick complete. Geometrický regression test měří 08:00–20:00 jako 720 minut
a 768 px při 64 px/h a současně kontroluje plnou výšku surface/focus wrapperu i
overlap sloupec. Workspace testy
ověřují namespacovaný bezpečný stav, stálou
`/app`, invalid fallback a logout cleanup. Single-household testy pokrývají
owner/member bootstrap a převzetí bez resetu.

Location/travel testy používají mockované `GeocodingProviderPort` a
`RoutingProviderPort`. Pokrývají min query, safe mapper, rozlišené provider
chyby, timeout, zákaz cache, PRIVATE scope, AUTO/default/custom/previous origin,
participant izolaci, self-link/cyklus, departure/buffer, konflikt a stale
propagaci. Frontend testuje 350ms debounce, AbortSignal, klávesový combobox,
default-place flow, explicitní výběr, ruční fallback, automatický route preview,
účastníky, směnové presety, atribuci a oddělenou view cache. Žádný unit test
nekontaktuje Mapy.com.

Scheduling testy oddělují čisté skládání intervalů od aplikační orchestrace.
Pokrývají společnou dostupnost, přesný fit, 15minutové hranice, každého
účastníka s vlastním originem, route timeout, varování bez lokace, podepsanou
revalidaci původního okna a souběžné potvrzení. Frontend ověřuje, že slot není
automaticky vybrán, starý request se zruší a confirm/unschedule používají
centrální klient s credentials a CSRF. Mapy adapter je vždy mockovaný.

Theme testy ověřují výchozí `system`, dark i light OS stav, živou změnu OS,
ignorování OS při explicitní volbě, namespacované uložení, fallback neplatné
hodnoty, `theme-color`, absenci auth storage a sémantiku selectoru.

Finance testy používají pouze anonymizované syntetické účty. Ověřují
string/`BigInt` minor units bez float, znaménková ledger pravidla, category
kind, atomické dvě strany převodu, household a role boundary, oddělení měn,
document facade a to, že soft-delete změní zůstatek/report. Frontend testuje
český money parser, date picker, page sizes, adaptivní list, Dialog potvrzení a
dashboard přes veřejný hook.

Finance budget testy navíc ověřují celkový/kategoriální limit, refund a
transfer semantics, nezařazené výdaje, integer forecast, warning/exceeded
stavy, stejnou část historického období, idempotentní insight hash a pravidelný
interval s částkovou tolerancí. Storybook/Playwright/axe scénáře používají jen
syntetické částky a názvy, pokrývají compact/medium/expanded light/dark UI a
nikdy nekontaktují banku.

Bucket list testy používají pevný clock a anonymizované názvy. Backend pokrývá
unikátní household/year, role, cizího účastníka/místo/dokument, atomické
dokončení s historií, progress, dashboard a rollover bez completion history.
Frontend pokrývá viewer stav, date-only formulář, filtry bez URL, quick
complete, pravdivý empty state a interní UUID pouze ve validovaném workspace
state. Storybook/Playwright/axe scénáře pokrývají compact i expanded seznam a
oba motivy.

### HTTP integrační testy

Nest test aplikace a Supertest ověřují routování a guard pipeline:
deny-by-default, public allowlist, anonymní auth, interní health token, Origin,
CSRF, disabled user, household izolaci a zákaz statických uploadů.

### Storybook browser testy

`pnpm storybook:test` transformuje stories na Vitest testy v Chromium. Addon
a11y vynucuje WCAG. Stories pokrývají foundations, používané UI, ThemeSelector,
login, tři shell režimy, Bucket list a empty dashboard light/dark. Fixtures jsou
deterministické a mimo produkční kód. Calendar stories navíc pokrývají měsíc,
týden s vícedenní/noční směnou a event Dialog/full-screen variantu.

### Vizuální testy

`pnpm test:visual` porovnává 78 deterministických PNG baseline. Povinné
kombinace dashboardu jsou 390×844 dark, 390×844 light, 768×1024 dark,
1280×800 light a 1440×900 dark.

Další scénáře pokrývají login dark/light na telefonu a desktopu, fixture
dashboard, Agendu, kalendář včetně desktopového týdne, event create dialog,
otevřené user menu, mobilní Více, ThemeSelector, dialog a sheet.
Stabilizují se fonty, locale, timezone, motion a caret. Storybook authenticated
dashboard je deterministický UI mock, nikoli důkaz reálného Google loginu.

### Accessibility testy

`pnpm test:accessibility` spouští axe WCAG 2.2 AA, focus return dialogu, skip
link, 200% text, 44px targets, reduced motion a reflow na 360×800, 390×844,
430×932 a 768×1024. Screenshot ani axe nenahrazuje úplné ruční UX posouzení.

## Externí služby

Testy nevolají Google servery, nevyžadují reálný účet ani neukládají skutečný
credential. Storybook mockuje pouze obsah GIS kontejneru; produkční komponenta
dál používá oficiální Google Identity Services API.
Totéž platí pro Mapy.com: provider kontrakty se mockují. Skutečný smoke je
volitelný, používá pouze veřejné syntetické cíle a nesmí být vydáván za unit
test ani za ověření soukromých adres.

## Bezpečnostní scénáře

Při změně auth nebo API vždy zvaž anonymního a disabled usera, expirovanou a
revokovanou session, CSRF/Origin, public allowlist, interní token, household
izolaci a storage traversal/cleanup.

`pnpm env:check` je alias pro `pnpm environment:check`. Kontrola ověřuje
centrální `.env.example`, zakazuje vnořené env soubory a tajné `VITE_*` názvy.

## Příkazy

```bash
pnpm test
pnpm env:check
pnpm architecture:check
pnpm docs:check
pnpm storybook:test
pnpm storybook:build
pnpm test:visual
pnpm test:accessibility
pnpm check
```

`pnpm check` kombinuje architekturu, environment, dokumentaci, lint, strict
typecheck, unit/HTTP testy, Storybook test/build, produkční build, screenshoty,
accessibility a formát. Browser testy mohou v sandboxu potřebovat lokální socket;
nejsou kvůli tomu vynechané.
