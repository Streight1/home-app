# HomeApp / life-admin

HomeApp je webová aplikace z repozitáře `life-admin` pro centrální správu
domácnosti. Aktuální základ
poskytuje bezpečné přihlášení přes Google, serverové relace, uživatele,
sdílenou domácnost, chráněný český dashboard a použitelné moduly Dokumenty,
Úkoly, Kalendář včetně chytrého plánování a ruční Finance. Majetek, vozidla a
jídelníček zatím nejsou implementované.

## Technologie

- Node.js 24, pnpm workspace a TypeScript strict
- React, Vite, React Router, TanStack Query a Tailwind CSS
- NestJS REST API, Prisma ORM a PostgreSQL 18
- Google Identity Services a serverové relace v PostgreSQL
- Docker Compose pro lokální databázi a single-VPS staging

## Implementovaný základ

- Google login s backendovým ověřením tokenu a serverovým allowlistem
- revokovatelné hashované relace, CSRF a přesná Origin kontrola
- uživatel, domácnost, členství a audit loginu/odhlášení
- deny-by-default API a interně chráněné health endpointy
- feature-oriented frontend a dokumentová knihovna se složkami, typovými
  metadaty, poznámkami, náhledem/downloadem a auditem
- prezentační dokumentový seznam, adaptivní modály, archiv, koš a bezpečný
  permanent delete přes storage deletion outbox;
- layout-aware vytěžování faktur z PDF textové vrstvy s line items,
  vysvětlitelnou confidence a explicitním review návrhů;
  image OCR není nakonfigurované a nevytváří falešná data
- Úkoly s jednorázovým i opakovaným chováním, více účastníky, délkou, místem,
  historií dokončení, dokumentovými vazbami a dashboardovým widgetem
- samostatný sdílený Kalendář s událostmi, přesnými směnovými presety,
  barevně rozlišenými účastníky, cílovými šablonami, Mapy.com autocomplete,
  participant-specific AUTO odhadem cesty, timezone/DST validací,
  transakčním bulk apply, feedem úkolů a skutečným denním/týdenním time-gridem
- samostatný Scheduling modul, který hledá společné volné sloty, omezeně ověřuje
  participant-specific cesty a vytváří calendar event až po explicitním potvrzení
- Finance jako přesný ruční household ledger s účty, dvouúrovňovými kategoriemi,
  příjmy, výdaji, atomickými stejnoměnovými převody, dokumentovými vazbami a
  pravdivým dashboardovým souhrnem; částky zůstávají v minor units
- interní workspace navigace: browser zobrazuje pouze `/login` nebo `/app`,
  zatímco Back/Forward a reload bezpečně obnovují validovaný interní stav
- volitelný single-household provisioning: nakonfigurovaný vlastník získá roli
  OWNER a ostatní allowlistované účty roli MEMBER ve stejné domácnosti
- design systém HomeApp Aurora s motivy podle systému, světlý a tmavý

Aktuální rozsah a omezení popisuje [stav projektu](docs/project-status.md).

## Požadavky

- Node.js 24 LTS
- pnpm 11.12.0
- Docker Engine a Docker Compose
- Google Web OAuth Client ID pro skutečné přihlášení

## Rychlé spuštění

```bash
pnpm install --frozen-lockfile
cp .env.example .env
# V kořenovém .env nastavte Google Client ID, health token a single-household.
docker compose up -d db
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev
```

Compose, API, Prisma i web čtou jediný kořenový `.env`; soubory v aplikačních
podsložkách se nepoužívají. Hodnoty s prefixem `VITE_` jsou veřejnou součástí
browser bundlu a nesmějí obsahovat tajemství.

Limity CSV importu (`FINANCE_IMPORT_MAX_FILE_BYTES`,
`FINANCE_IMPORT_MAX_ROWS`, `FINANCE_IMPORT_SESSION_TTL_HOURS`) jsou připravené
v `.env.example`; browserová kopie velikostního limitu je jen nápověda a API ji
vždy znovu vynucuje. Starší lokální konfigurace bez těchto tří hodnot použije
bezpečné serverové limity 20 MiB, 100 000 řádků a 24 hodin.

Podrobný a bezpečný postup je v
[lokálním vývoji](docs/development/local-development.md). Nastavení Google Cloud
popisuje [Google OAuth runbook](docs/runbooks/google-oauth.md).

## VPS staging

Hlavní internetový staging používá hotové GHCR image a
`deployment/compose.yaml`. Caddy je jediná veřejná služba na 80/443, API a
PostgreSQL nemají host port, runtime data jsou v named volumes a migrace jsou
one-shot podmínka startu API. Veřejnou browser konfiguraci generuje gateway při
startu, takže změna domény, Google Client ID, staging labelu nebo limitů
nevyžaduje rebuild image.

Po jednorázové přípravě `deployment/.env`, secret souborů a případného GHCR
loginu je první start i staging aktualizace:

```bash
cd deployment
docker compose up -d
```

Postup popisuje [one-command runbook](docs/runbooks/one-command-deployment.md),
registry [GHCR runbook](docs/runbooks/container-registry.md) a hardening
[VPS deployment runbook](docs/runbooks/vps-deployment.md).
`compose.prod.yaml` zůstává bezpečně zachovaná legacy cesta pro migraci
existujícího VPS; lokální `compose.yaml` zůstává vývojový.

Browserové URL jsou záměrně pouze `http://localhost:5173/login` a
`http://localhost:5173/app`. Obrazovky a entity uvnitř workspace nejsou veřejně
deep-linkovatelné; skrytí cesty ale není bezpečnostní hranice a API vždy ověřuje
session, household členství a roli.

## Základní příkazy

```bash
pnpm dev
pnpm architecture:check
pnpm env:check
pnpm environment:check
pnpm docs:check
pnpm lint
pnpm typecheck
pnpm test
pnpm storybook
pnpm storybook:test
pnpm test:visual
pnpm build
pnpm deployment:check
pnpm ci:check
pnpm ci:browser
pnpm ci:containers
pnpm check
```

## Dokumentace

- [Dokumentační rozcestník](docs/README.md)
- [Architektura](docs/architecture/overview.md)
- [API katalog](docs/api/endpoints.md)
- [Bezpečnostní zásady](SECURITY.md)
- [Přispívání](CONTRIBUTING.md)
- [Vývojový postup pro Codex](docs/development/codex-workflow.md)
- [Continuous integration](docs/development/continuous-integration.md)
- [Design systém](DESIGN.md)
- [Changelog](CHANGELOG.md)
