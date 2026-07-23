# Lokální vývoj

## Požadované nástroje

- Node.js 24 LTS, verzi projektu vybírá `.nvmrc`;
- pnpm 11.12.0 z pole `packageManager`;
- Docker Engine a Docker Compose;
- Google Web OAuth Client ID pro skutečné přihlášení.

```bash
nvm use
corepack enable
corepack prepare pnpm@11.12.0 --activate
node --version
pnpm --version
docker compose version
```

## Instalace závislostí

```bash
pnpm install --frozen-lockfile
```

Lockfile se mění pouze společně se záměrnou změnou `package.json`. Build skripty
jsou omezené workspace allowlistem.

## Environment konfigurace

```bash
cp .env.example .env
```

Kořenový `.env` je jediný lokální konfigurační soubor. Nevytvářej kopie v
`apps/api` ani `apps/web`. Z jednoho souboru čtou:

- Docker Compose nativním načtením kořenového `.env`;
- Nest ConfigModule a Prisma přes kanonickou cestu vůči workspace;
- Vite přes kořenový `envDir`.

Syntaxe `${NAME}` odvozuje související hodnoty. `WEB_ORIGIN` používá
`WEB_PORT`, `VITE_API_URL` používá `API_PORT`, frontendové Google Client ID
přebírá `GOOGLE_CLIENT_ID`, `VITE_MAX_UPLOAD_BYTES` přebírá serverový
`MAX_UPLOAD_BYTES`, `VITE_FINANCE_IMPORT_MAX_FILE_BYTES` přebírá veřejný limit
CSV z `FINANCE_IMPORT_MAX_FILE_BYTES` a `DATABASE_URL` se skládá z PostgreSQL hodnot.
Neměň odvozenou hodnotu, pokud stačí změnit její zdroj.

Před startem nahraď ukázkové `GOOGLE_CLIENT_ID` skutečným Web Client ID,
vygeneruj vlastní `INTERNAL_HEALTH_TOKEN` s alespoň 32 náhodnými znaky a podle
potřeby nastav `GOOGLE_ALLOWED_EMAILS`. `SESSION_COOKIE_NAME` a
`CSRF_COOKIE_NAME` musí obsahovat jen písmena, číslice, `_` nebo `-`.

Pro jednoduchou společnou domácnost ponech `SINGLE_HOUSEHOLD_MODE=true`, nastav
`SINGLE_HOUSEHOLD_OWNER_EMAIL` na adresu vlastníka, stejnou adresu zahrň do
`GOOGLE_ALLOWED_EMAILS` a zvol `SINGLE_HOUSEHOLD_NAME`. Vlastník se musí
přihlásit první; další allowlistované účty po restartu API získají MEMBER ve
stejné household. Režim nevytváří invitations ani app-level konfiguraci.

Proměnné `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` a klientská kopie limitu
`VITE_MAX_UPLOAD_BYTES` i `VITE_FINANCE_IMPORT_MAX_FILE_BYTES` jsou veřejné pro browser.
Vite navíc předá pouze ne-citlivý název CSRF cookie. Heslo databáze,
`DATABASE_URL`, interní health token ani session tajemství nesmějí mít prefix
`VITE_`.

Deployment názvy `APP_DOMAIN`, `APP_RELEASE`, `APP_ENV_LABEL`,
`APP_RUNTIME_UID/GID`, `ACME_EMAIL`, `GATEWAY_MAX_REQUEST_BODY`,
`BACKUP_RETENTION_COUNT` a `VPS_MIN_FREE_BYTES` lokální servery nepoužívají.
Jsou v centrálním `.env.example`, aby staging stále měl jediný kořenový
kontrakt. `VITE_APP_ENV_LABEL` je veřejný build-time label; při prázdné hodnotě
se badge nezobrazí. Produkční hodnoty a same-origin `/api/v1` popisuje
[VPS runbook](../runbooks/vps-deployment.md).

CSV import omezuje server pomocí `FINANCE_IMPORT_MAX_FILE_BYTES`,
`FINANCE_IMPORT_MAX_ROWS` a `FINANCE_IMPORT_SESSION_TTL_HOURS`. Klientský limit
je pouze UX nápověda; bezpečnostní validace vždy probíhá znovu na API. Pokud
starší lokální `.env` tyto hodnoty ještě neobsahuje, API použije bezpečné
výchozí hodnoty 20 MiB, 100 000 řádků a 24 hodin.

Kontrakt lze ověřit bez spuštění služeb:

```bash
pnpm environment:check
docker compose --env-file .env config --quiet
```

Google Cloud postup je v [Google OAuth runbooku](../runbooks/google-oauth.md).

Mapy.com je ve výchozím stavu vypnuté. Pro skutečný development smoke použij
vlastní oddělený klíč pouze v kořenovém `.env`, nastav
`MAPY_API_ENABLED=true` a postupuj podle [Mapy runbooku](../runbooks/mapy-api.md).
Klíč nemá `VITE_` prefix a nikdy se nekopíruje do browser konfigurace. Bez něj
funguje ruční místo, pouze Suggest a odhad cesty vracejí bezpečný nedostupný
stav.

## PostgreSQL

```bash
docker compose up -d db
docker compose ps
```

Compose používá `postgres:18.4-bookworm`, heslovou SCRAM autentizaci a bind mount
`./database/postgres:/var/lib/postgresql`. PostgreSQL proměnné jsou povinné a
Compose je neschovává za fallbacky. Host port lze změnit přes `POSTGRES_PORT`;
odvozená `DATABASE_URL` změnu převezme automaticky.

Již inicializovaný `database/postgres/` si pamatuje původní roli a databázi.
Pokud měníš `POSTGRES_USER`, `POSTGRES_PASSWORD` nebo `POSTGRES_DB`, nemaž
existující data; zachovej původní hodnoty nebo role/databázi změň vědomým SQL
postupem po vytvoření zálohy.

PGDATA se nesmí ručně upravovat nebo mazat za běhu. Bezpečné zálohy popisuje
[backup runbook](../runbooks/backup-and-restore.md).

## Prisma

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

Vývoj nové migrace popisuje
[průvodce databázovými migracemi](database-migrations.md). `pnpm db:studio`
spustí Prisma Studio, obvykle na `http://localhost:5555`.

## Spuštění aplikace

```bash
pnpm dev
```

Příkaz spustí API i web a propaguje ukončovací signály. Lokální URL:

- web: `http://localhost:5173`;
- login: `http://localhost:5173/login`;
- chráněná workspace: `http://localhost:5173/app` (feature view zůstává interní);
- API prefix: `http://localhost:3000/api/v1`;
- interní liveness: `http://localhost:3000/internal/health/live`;
- interní readiness: `http://localhost:3000/internal/health/ready`.

Health vyžaduje backendový token:

```bash
set -a
. ./.env
set +a
curl -H "X-Internal-Health-Token: $INTERNAL_HEALTH_TOKEN" \
  "http://localhost:${API_PORT}/internal/health/ready"
```

## Zastavení

Vývojové servery ukonči `Ctrl-C`. PostgreSQL bezpečně zastavíš:

```bash
docker compose stop db
```

`docker compose down` odstraní kontejner a síť, ale bind-mounted PGDATA zůstane.
Nepoužívej automatický reset ani nemaž `database/postgres/` za běhu databáze.

## Runtime soubory

`database/postgres/` a `uploads/` jsou ignorované Gitem. `UPLOAD_ROOT=uploads`
se řeší vůči kořeni workspace, ne podle pracovního adresáře procesu. Do těchto
složek nevkládej testovací soubory se skutečnými osobními daty.

Při problému pokračuj podle [troubleshooting runbooku](../runbooks/troubleshooting.md).
