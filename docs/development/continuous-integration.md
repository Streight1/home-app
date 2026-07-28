# Continuous integration

## Účel

Jediný workflow `.github/workflows/publish-containers.yml` ověřuje stejnou
revizi, kterou případně publikuje do GHCR. Běží v čistém GitHub runneru bez
kořenového `.env`, produkčních credentialů, Google Client ID nebo Mapy klíče.
Syntetické CI hodnoty nejsou provozní tajemství.

## Stabilní joby

Workflow má šest povinných validačních jobů a jeden podmíněný publish job:

| Required check                  | Odpovědnost                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `Quality / Static checks`       | workflow, architektura, env, deployment, docs, lint, typy a formát       |
| `Tests / API`                   | Prisma validace/generate, migrace od prázdné PostgreSQL a API test/build |
| `Tests / Web`                   | unit/component testy, generický runtime-config build a Storybook build   |
| `Tests / Browser accessibility` | Storybook, axe, klávesnice, reflow, touch target a reduced motion        |
| `Tests / Browser visual`        | kanonické screenshot baseline v připnutém Playwright containeru          |
| `Containers / Validation`       | build obou image a izolovaný Compose smoke                               |

Tyto názvy jsou doporučené required checks v branch protection. `Publish`
required checkem pro pull request není, protože se tam záměrně nespouští.
Validační joby běží paralelně a mají jen `contents: read`.

## Spouštěcí a publikační pravidla

- Pull request do `main` spustí všech šest validací a nic nepublikuje.
- Push do `main` po úspěchu všech validací publikuje `staging` a celý commit
  SHA.
- Git tag `vX.Y.Z` po validaci publikuje `vX.Y.Z`, `X.Y`, `X` a celý commit
  SHA. `staging` release tag nemění.
- Ruční `workflow_dispatch` spustí validace a publikuje jen commit SHA.

Workflow nepublikuje `latest`. Pouze publish job má `packages: write` a používá
vestavěný `GITHUB_TOKEN`. Publish znovu nespouští testy; sestaví přesně checkout
revize, jejíž všechny dependency joby uspěly.

## Reprodukovatelný setup

Lokální composite action `.github/actions/setup-project/action.yml`:

1. načte Node z `.nvmrc`;
2. nainstaluje připnutý Corepack;
3. aktivuje a ověří `pnpm` z root `packageManager`;
4. provede `pnpm install --frozen-lockfile`;
5. podle inputu spustí `pnpm ci:generate`.

`ci:generate` provede Prisma generate a ověří očekávaný klient, model entrypoint,
velikost i návaznost na schema. Prisma generate používá syntetickou
`DATABASE_URL`, ale databázové spojení nepotřebuje. API Dockerfile generuje
klienta znovu uvnitř image buildu a nespoléhá na artefakt jiného jobu.

## Databázové testovací prostředí

API job používá samostatný PostgreSQL 18 service container s dočasnými CI
credentials. Po readiness spustí:

```bash
pnpm --filter @life-admin/api exec prisma validate
pnpm db:migrate:deploy
pnpm --filter @life-admin/api exec prisma migrate status
```

Tím se migrace ověřují od prázdné databáze bez `migrate dev` a bez resetu.
Unit/HTTP testy zůstávají deterministické a externí služby mockují.

## Veřejná konfigurace webu v testech

Produkce načítá `window.__HOMEAPP_CONFIG__` z gateway
`/runtime-config.js`. Vite konfigurace je rozdělená podle odpovědnosti:

- `vite.shared.config.ts` obsahuje pouze React/Tailwind pluginy a obecné build
  nastavení; má `envDir: false`;
- `vite.config.ts` skládá generický produkční build pouze ze shared vrstvy;
- `vite.development.config.ts` je explicitní vstup `pnpm dev`, jako jediný čte
  kořenový `.env` a validuje lokální API, Google, port a CSRF cookie;
- Vitest a Storybook skládají pouze shared vrstvu a nikdy neaktivují aplikační
  dev server jen proto, že Vite běží v režimu `serve`.

Unit, Storybook a browser testy používají jedinou fixture
`TEST_PUBLIC_RUNTIME_CONFIG`; nevyžadují `.env`, `VITE_API_URL` ani skutečný
Google Client ID. Fixture obsahuje také syntetický název CSRF cookie, protože
ten browser ke čtení double-submit cookie skutečně potřebuje. Název
`X-CSRF-Token` je stabilní HTTP kontrakt, nikoli deployment konfigurace. Test
setup fixture obnoví před každým testem a po testu ji odstraní.

Webový Docker build je generický. Kontrola artefaktů ověřuje načtení
`runtime-config.js`, zákaz backendových secret názvů i nepřítomnost
syntetického CI Google Client ID v browser bundlu.

## Browser testy

Playwright je deklarovaný ve workspace `@life-admin/web`. Accessibility
a visual sada jsou dva samostatné povinné joby v oficiálním image
`mcr.microsoft.com/playwright:v1.61.1-noble`, připnutém digestem z baseline
metadata. Image již obsahuje Chromium revision 1228 (149.0.7827.55), proto
job nespouští další `playwright install`.

`ci:browser` spustí Storybook test projekt, accessibility sadu a kanonickou
kontejnerovou visual kontrolu. Storybook test plugin si skládá stories přímo
přes Vitest/Vite; samostatný statický HTTP server nepotřebuje. Playwright
používá vlastní deklarovaný Storybook `webServer`, čeká na `/index.json`
a v CI nikdy nespoléhá na dříve spuštěný server. Obě cesty používají shared
Vite config a stejnou runtime fixture. CI baseline screenshoty nikdy
neaktualizuje. Lokální reuse existujícího Storybooku je pouze explicitní
optimalizace přes `PLAYWRIGHT_REUSE_STORYBOOK=true`; výchozí test vlastní
start i ukončení serveru.

Runner používá dostupný systémový locale `LANG=C.UTF-8`. České formátování se
testuje explicitně browserovým `locale: cs-CZ`; systémový shell locale a
JavaScript `Intl` locale jsou dvě odlišné vrstvy. Tím nevzniká varování kvůli
nenainstalovanému `cs_CZ.UTF-8`.

Visual validator ještě před screenshoty porovná package, Chromium, Ubuntu,
image digest, lokální Inter, browser locale, timezone a DPR s
`apps/web/e2e/visual-baseline.json`. Kontrolované vytváření a review PNG
popisuje [dokumentace vizuálních regresí](visual-regression.md).

## Container validation

`pnpm ci:containers` sestaví `homeapp-api:ci` a `homeapp-web:ci` pro
`linux/amd64`. Přes `deployment/compose.ci.yaml` použije náhodný project name,
loopback HTTP port, syntetické secret soubory a unikátní volumes. Nikdy
nepoužije staging volumes.

Smoke ověřuje:

- `volumes-init`, healthy DB, úspěšnou migraci, healthy API a gateway;
- SPA fallback `/login` a `/app`, runtime config a anonymní `401`;
- neveřejné `/uploads` a `/internal`, nepřipojené uploads v gateway;
- non-root API, read-only root a absenci `.env`, `.git`, runtime dat a hodnot
  secretů v image;
- druhý start, idempotentní migraci a perzistenci DB i private-uploads markeru
  bez `down -v`;
- izolované selhání migrace, které zabrání startu API.

Test po sobě maže pouze volumes s vlastním CI prefixem.

## Artefakty a diagnostika

Při selhání se na sedm dnů ukládají pouze relevantní reporty: Vitest JUnit,
Prisma migration log se syntetickými údaji, oddělený accessibility report,
visual HTML report s `expected`/`actual`/`diff` a trace prvního retry
a sanitizovaný Compose stav/log. Raw `test-results` se vedle HTML reportu
neuploadují podruhé. Neukládá se `.env`, secret soubor, databázový dump, cookie
ani token. Každý job zapisuje stav a dostupný počet testů do
`GITHUB_STEP_SUMMARY`; publish vypíše přesné image reference.

Neúspěch diagnostikuj od prvního červeného required checku. U browser testu
stáhni browser artifact, u container testu nejprve `validation-summary` a
sanitizované service logy. Publish se po selhání nebo zrušení dependency jobu
nespustí.

## Lokální příkazy

```bash
pnpm ci:generate
pnpm ci:workflow
pnpm ci:check
pnpm ci:browser
pnpm ci:containers
```

`ci:check` simuluje generate, statické kontroly, unit testy a buildy.
`ci:browser` používá Docker pro visual část, takže hostitelský browser neurčuje
baseline. `ci:containers` vyžaduje Docker a používá jen izolované CI volumes.
Úplná vývojová brána `pnpm check` zahrnuje stejnou kanonickou visual kontrolu
i samostatné accessibility testy.
