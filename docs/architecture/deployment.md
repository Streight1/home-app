# Deployment

## Podporované provozní režimy

HomeApp zachovává tři oddělené režimy:

1. `compose.yaml` pro lokální vývoj a hostitelské dev servery;
2. `compose.prod.yaml` jako kompatibilní původní VPS cesta s buildem ze
   zdrojového repozitáře a bind mounty;
3. `deployment/compose.yaml` jako hlavní registry deployment bez zdrojového
   kódu, Node.js a buildu na VPS.

Nový single-VPS staging má topologii:

```text
Internet :80/:443
        │
        ▼
gateway (GHCR web image: Caddy + statický React build)
        │ /api/*
        ▼
api:3000 (GHCR API image) ─────► db:5432
        │
        └───────────────────────► homeapp_uploads_data

one-shot: volumes-init → db healthy → migrate success → api healthy → gateway
```

Pouze gateway publikuje host porty 80/443. API a PostgreSQL jsou dosažitelné
jen přes Docker síť `backend`; API si zachovává odchozí HTTPS pro Google a
volitelný Mapy provider. Gateway explicitně odmítá `/internal/*` a `/uploads/*`.

## Registry image a CI

GitHub Actions workflow `.github/workflows/publish-containers.yml` po
`pnpm check` sestaví a publikuje:

- `ghcr.io/streight1/home-app-api`;
- `ghcr.io/streight1/home-app-web`.

Workflow používá pouze `GITHUB_TOKEN` s `contents: read` a v publish jobu
`packages: write`. Použité actions jsou připnuté na úplné commit SHA. Build
nedostává produkční tajemství. OCI metadata obsahují source, revision, created a
version hodnoty generované `docker/metadata-action`.

Tagy mají odlišnou stabilitu:

- `staging` je mutable tag výchozí větve; s `pull_policy: always` jej běžné
  `docker compose up -d` aktualizuje;
- plný commit SHA je neměnný identifikátor konkrétního buildu;
- `vX.Y.Z` je release tag určený pro řízené připnutí.

Workflow je připravený, ale publikování nastane až skutečným během GitHub
Actions s povoleným package přístupem.

## Image

`apps/web/Dockerfile` je multi-stage build. Node 24 a pnpm sestaví jeden
obecný artefakt; runtime používá Caddy a neobsahuje Vite server ani workspace
`node_modules`. Gateway entrypoint před startem vygeneruje do tmpfs
`/run/homeapp/runtime-config.js`.

`apps/api/Dockerfile` vytváří image `api`, který obsahuje:

- production dependencies a sestavený NestJS;
- Prisma klient, migrace a lokální Prisma CLI;
- one-shot migration runner;
- interní healthcheck čtoucí token ze secret souboru.

Běžný API proces běží jako UID/GID `10001`, s read-only root filesystemem,
`no-new-privileges`, bez capabilities a zapisuje pouze do uploads volume a
tmpfs `/tmp`. Stejný API image používá služba `migrate`; nespouští `migrate dev`
ani reset.

## Startovací graf a migrace

Compose conditions tvoří skutečnou readiness posloupnost:

1. `volumes-init` idempotentně vytvoří podsložky uploads a backupu, nastaví
   `APP_RUNTIME_UID:GID` a připraví omezené runtime kopie Compose secrets;
2. `db` inicializuje PostgreSQL a musí projít `pg_isready`;
3. `migrate` spustí `prisma migrate deploy` a musí skončit kódem 0;
4. `api` čeká na `volumes-init`, healthy DB a úspěšnou migraci;
5. `gateway` čeká na healthy API.

Selhání migrace zabrání startu API. Při novém image digestu Compose jednorázový
container znovu vytvoří; opakovaný `migrate deploy` bez pending migrací je
bezpečný. Aplikační rollback tagu není databázový rollback a migrace musí být
dopředně kompatibilní.

## Runtime konfigurace frontendu

Produkční browser už nepřebírá doménu, Google Client ID, environment label ani
upload limity z konkrétního Vite buildu. `index.html` načte před React
bootstrapem `runtime-config.js`, který nastaví allowlistovaný objekt
`window.__HOMEAPP_CONFIG__`:

- `API_URL`;
- `GOOGLE_CLIENT_ID`;
- `APP_ENV_LABEL`;
- `MAX_UPLOAD_BYTES`;
- `FINANCE_IMPORT_MAX_FILE_BYTES`;
- `CSRF_COOKIE_NAME`.

Frontend kontroluje typy, formát i neznámé klíče. Chybějící nebo neplatná
produkční konfigurace zobrazí bezpečnou českou chybovou obrazovku a aplikaci
nenastartuje. `runtime-config.js` má `Cache-Control: no-store`. Lokální Vite
vývoj používá oddělený adapter nad kořenovým `.env`.

Gateway generátor nepřijímá `DATABASE_URL`, PostgreSQL heslo, health token,
Mapy klíč, session ani CSRF token. Název CSRF cookie je veřejný; samotný CSRF
token zůstává cookie/request hodnota.

## Secrets

Standalone deployment používá read-only Compose secret soubory:

```text
deployment/secrets/postgres_password
deployment/secrets/internal_health_token
deployment/secrets/mapy_api_key
```

PostgreSQL používá nativní `POSTGRES_PASSWORD_FILE`. Lokální Compose připojuje
file-backed secret se zachovaným hostitelským vlastníkem, proto jej root
`volumes-init` při každém startu atomicky zkopíruje s režimem `0440` a
`APP_RUNTIME_UID:GID` do `homeapp_runtime_secrets`. API, migrace a maintenance
jej připojí pouze read-only; gateway ani PostgreSQL data volume k němu přístup
nemají. Tím mohou source soubory na hostiteli zůstat `0600`, zatímco aplikační
proces zůstává neprivilegovaný.

API společný resolver dává `POSTGRES_PASSWORD_FILE`,
`INTERNAL_HEALTH_TOKEN_FILE` a `MAPY_API_KEY_FILE` přednost před kompatibilními
env fallbacky. Z PostgreSQL hesla a explicitních host/user/db hodnot bezpečně
sestaví `DATABASE_URL` pouze uvnitř procesu. Secret hodnoty nejsou v image,
build args, Compose environment výpisu, gateway ani browseru.

## Perzistence

Výchozí názvy:

```text
homeapp_postgres_data
homeapp_uploads_data
homeapp_caddy_data
homeapp_caddy_config
homeapp_backups
homeapp_runtime_secrets
```

PostgreSQL volume mountuje jen `db`. Uploads volume mountují v hlavním Compose
jen `volumes-init`, `api` a read-only maintenance `backup`; gateway jej nemá.
Backup volume mountují jen `volumes-init` a maintenance služba. Runtime secret
volume mountují jen `volumes-init`, `migrate`, `api` a maintenance; do zálohy
se nezahrnuje. Caddy data/config přežijí restart. `docker compose down` bez
`-v` named volumes neodstraní. `down -v` je pro provozní stack zakázaný.

Přechod z legacy bind mountů provádí pouze
`scripts/migrate-vps-data-to-volumes.sh`: nejprve vytvoří logical `pg_dump` a
uploads archiv, obnoví je do nových volumes, porovná počty a SHA-256 manifest
uploadů a teprve poté provede cutover. Původní bind mounty nesmaže.

## Záloha a obnova

Maintenance profil spouští:

```bash
docker compose --profile maintenance run --rm backup
```

Backup používá `pg_dump`, read-only uploads, backup volume, manifest a
`SHA256SUMS`; aktivní PGDATA nemountuje. Restore vyžaduje samostatný override,
zastavené gateway/API, explicitní `BACKUP_ID` a `RESTORE_CONFIRM=OBNOVIT`.
Detail je v [backup runbooku](../runbooks/backup-and-restore.md).

Backup volume stejného VPS není off-site ochrana. Ověřenou zálohu je nutné
šifrovaně exportovat na oddělené úložiště.

## Sítě, proxy a logy

Caddy načítá hostname z `APP_DOMAIN`, automaticky spravuje TLS, gzip/zstd,
request limit a CSP kompatibilní s Google Identity Services, avatary a blob
preview. API v production vynucuje `TRUST_PROXY=true`, přesný `WEB_ORIGIN`,
secure session cookie a deny-by-default endpointy.

Všechny dlouho běžící služby mají `restart: unless-stopped`. Logy jdou na
stdout/stderr přes `json-file` s rotací 10 MiB × 3. Aplikační pravidla zakazují
tokeny, cookies, provider klíče, database URL, upload obsah a bankovní data.

## Omezení

Jde o single-VPS staging, nikoli high availability. Výpadek VPS znamená výpadek
celé aplikace. Registry login je u privátních image jednorázová ruční operace.
Automatický off-site transport a monitoring/alerting nejsou součástí stacku.
