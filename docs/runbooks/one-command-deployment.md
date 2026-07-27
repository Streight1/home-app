# One-command deployment

## Jednorázová příprava

Na VPS stačí Docker Engine, Compose plugin a obsah adresáře `deployment/`.
Připrav:

```bash
cd /srv/homeapp/deployment
cp .env.example .env
chmod 600 .env
mkdir -p secrets
chmod 700 secrets
```

V `.env` nastav doménu, `WEB_ORIGIN`, Google Client ID/allowlist, household
hodnoty, limity a `APP_IMAGE_TAG`. Nevkládej sem database URL, PostgreSQL heslo,
health token ani Mapy klíč.

Vytvoř soubory:

```text
secrets/postgres_password
secrets/internal_health_token
secrets/mapy_api_key
```

Nastav je na `0600`. `volumes-init` vytvoří jejich omezené runtime kopie pro
neprivilegované API, migraci a maintenance; není potřeba měnit vlastníka
source secret souborů. Pokud jsou GHCR image privátní, jednou se přihlas podle
[registry runbooku](container-registry.md).

## První start

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
```

Očekávaný stav:

- `volumes-init` — `Exited (0)`;
- `db` — `healthy`;
- `migrate` — `Exited (0)`;
- `api` — `healthy`;
- `gateway` — `running`.

Není potřeba ručně vytvářet volume, spouštět DB, měnit vlastníka uploads,
spouštět Prisma ani buildovat image.

## Běžná staging aktualizace

Výchozí `APP_IMAGE_TAG=staging` a `APP_PULL_POLICY=always` umožňují:

```bash
docker compose up -d
```

Explicitní varianta:

```bash
docker compose pull
docker compose up -d
```

Compose při změně API image znovu vytvoří one-shot migrate container. API čeká
na úspěšný exit migrace. Opakovaný start bez pending migrací je bezpečný.
Tag `staging` se publikuje pouze z úspěšného push workflow na `main`. Pull
request ani neúspěšná statická, API, web, browser či container kontrola jej
nezmění.

## Změna veřejné browser konfigurace

Hodnoty `GOOGLE_CLIENT_ID`, `APP_ENV_LABEL`, `MAX_UPLOAD_BYTES`,
`FINANCE_IMPORT_MAX_FILE_BYTES`, `CSRF_COOKIE_NAME` a same-origin `/api/v1`
generuje gateway při startu. Po změně `.env` stačí:

```bash
docker compose up -d --force-recreate gateway
```

Web image se nerebuildí. Produkční frontend chybějící nebo neplatný runtime
config odmítne a zobrazí bezpečnou chybovou obrazovku.

## Data a zastavení

```bash
docker compose stop
docker compose start
docker compose down
```

Všechny tři příkazy zachovají named volumes. `docker compose down -v` je
zakázaný, protože odstraní provozní data.

## Záloha

```bash
docker compose --profile maintenance run --rm backup
```

Výsledek zůstane v `homeapp_backups`. Export na hostitele:

```bash
mkdir -p backup-export
docker run --rm \
  -v homeapp_backups:/from:ro \
  -v "$PWD/backup-export:/to" \
  alpine:3.22.2 cp -a /from/. /to/
```

Po checksum kontrole přenes šifrovanou kopii mimo VPS.

## Obnova

Obnova je explicitně destruktivní vůči cílovému stavu:

```bash
docker compose stop gateway api
BACKUP_ID=20260724T020000Z RESTORE_CONFIRM=OBNOVIT \
  docker compose \
  -f compose.yaml \
  -f restore.compose.yaml \
  --profile maintenance \
  run --rm backup /maintenance/restore.sh
docker compose rm -f migrate
docker compose up -d
```

Restore ověří checksumy, odmítne aktivní DB klienty, vytvoří pre-restore
bezpečnostní kopii, obnoví logical dump a uploads a ověří počet souborů. Nejprve
jej nacvič na izolovaném stacku s jinými názvy volumes.

## Migrace existujícího VPS

Ze starého source workspace:

```bash
./scripts/migrate-vps-data-to-volumes.sh --dry-run
./scripts/migrate-vps-data-to-volumes.sh --execute
```

Skript nepřepisuje existující cílové volumes a nemaže původní bind mount data.
Podrobný cutover je v [VPS runbooku](vps-deployment.md).
