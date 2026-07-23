# VPS staging deployment

Tento runbook nasadí HomeApp na jeden veřejný VPS přes Caddy, Docker Compose,
NestJS a PostgreSQL. Staging dodržuje produkční bezpečnostní konfiguraci. Příkazy
spouštěj jako oddělený neprivilegovaný deployment uživatel z kořene repozitáře.

## Předpoklady

- Debian/Ubuntu nebo jiný udržovaný Linux s 64bit Docker Engine a Compose
  pluginem;
- doména, jejíž DNS lze nasměrovat na VPS;
- veřejné porty 80/TCP a 443/TCP;
- SSH přístup pomocí klíče;
- alespoň disková rezerva z `VPS_MIN_FREE_BYTES`;
- klon aplikace například v `/srv/homeapp`.

Docker instaluj z distribučního nebo
[oficiálního Docker repozitáře](https://docs.docker.com/engine/install/).
Automatizační skripty záměrně nepoužívají neověřený `curl | sh`.

## VPS hardening

1. Vytvoř deployment uživatele bez sdíleného hesla a povol mu jen nutná
   oprávnění k Dockeru. Členství ve skupině `docker` je prakticky root
   oprávnění; Docker socket nikdy nevystavuj do sítě.
2. V SSH zakaž root login heslem a přihlášení heslem, ponech klíče.
3. Firewallem povol SSH z očekávaných adres a veřejně pouze 80/TCP a 443/TCP.
   Porty 3000 a 5432 neotvírej.
4. Pravidelně aktualizuj operační systém a Docker. Rootless Docker může být
   další vrstva ochrany, není ale podmínkou prvního staging deploye.

Příklad UFW uprav podle vlastního SSH portu:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## DNS

Nastav:

- A record `homeapp` na IPv4 VPS;
- volitelně AAAA record na skutečně dostupnou IPv6 VPS.

Před prvním startem ověř, že DNS z internetu vrací správný server. Caddy potřebuje
příchozí 80/443 pro ACME ověření a automatické HTTPS.

## Environment

```bash
cd /srv/homeapp
cp .env.example .env
chmod 600 .env
```

V kořenovém `.env` změň minimálně následující názvy; skutečné hodnoty nikdy
necommituj ani neposílej do issue:

```dotenv
NODE_ENV=production
APP_DOMAIN=<veřejný-hostname>
APP_PROTOCOL=https
APP_RELEASE=<identifikátor-release>
APP_ENV_LABEL=Staging
VITE_APP_ENV_LABEL=${APP_ENV_LABEL}
ACME_EMAIL=<provozní-e-mail>

WEB_ORIGIN=https://${APP_DOMAIN}
TRUST_PROXY=true
VITE_API_URL=/api/v1

POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=<název-databáze>
POSTGRES_USER=<databázová-role>
POSTGRES_PASSWORD=<silné-unikátní-heslo>
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public

GOOGLE_CLIENT_ID=<web-client-id>
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_ALLOWED_EMAILS=<povolené-adresy>
SINGLE_HOUSEHOLD_OWNER_EMAIL=<vlastník>
INTERNAL_HEALTH_TOKEN=<nejméně-32-náhodných-znaků>

APP_RUNTIME_UID=<číselné-uid-deployment-uživatele>
APP_RUNTIME_GID=<číselné-gid-deployment-uživatele>
```

UID/GID zjistíš příkazy `id -u` a `id -g`; do `.env` zapiš výsledná čísla,
nikoli shell substituci. Pro URL-safe heslo/token lze použít například
`openssl rand -hex 32`. `POSTGRES_PASSWORD` v `DATABASE_URL` musí být URL
encoded, pokud obsahuje speciální znaky.

`VITE_*` hodnoty jsou vložené do veřejného JavaScript bundlu při buildu. Nikdy
jim nedávej database URL, hesla, health token, session data, Mapy klíč ani jiné
tajemství. Mapy klíč zůstává pouze v backendové `MAPY_API_KEY`.

## Google OAuth

V Google Cloud Console přidej do Authorized JavaScript origins přesný HTTPS
origin:

```text
https://homeapp.example.cz
```

Nahraď ukázkový hostname vlastním. Současný Google Identity Services
popup/callback flow nepotřebuje backend redirect URI ani Client Secret. Stejný
Web Client ID používá frontend i backend, ID token vždy ověřuje backend a účet
musí projít `GOOGLE_ALLOWED_EMAILS`.

Požadavek odpovídá oficiálním pravidlům
[Authorized JavaScript origins](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
a [GIS CSP](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#content_security_policy).

## První start

Nejdřív ověř konfiguraci bez změny runtime:

```bash
./scripts/vps-preflight.sh --dry-run
./scripts/deploy-vps.sh --build --no-backup --dry-run
```

Na úplně novém VPS bez existující databáze je jediný přípustný první start bez
zálohy explicitní:

```bash
./scripts/deploy-vps.sh --build --no-backup
```

`--no-backup` nepoužívej, pokud `database/postgres/` už obsahuje provozní data.
Skript vytvoří runtime adresáře, sestaví image, nastartuje DB, počká na
readiness, spustí `prisma migrate deploy`, nastartuje API/gateway a ověří HTTPS.
Nevytváří pojmenovaný PostgreSQL volume a nikdy nemaže data.

## Ověření po prvním startu

```bash
docker compose --env-file .env -f compose.prod.yaml ps
curl --fail --show-error --silent "https://${APP_DOMAIN}/" >/dev/null
curl --fail --show-error --silent "https://${APP_DOMAIN}/login" >/dev/null
```

V interaktivním browseru ověř Google login, dashboard, zápis do databáze a
autentizovaný upload/download. Ověř, že `/internal/health/ready` ani
`/uploads/` nevrací interní data. CSP musí dovolit Google popup, avatar a blob
preview; neuvolňuj ji wildcardem, pokud se objeví chyba.

## Aktualizace

```bash
cd /srv/homeapp
git status --short
git pull --ff-only
./scripts/deploy-vps.sh --build --dry-run
./scripts/deploy-vps.sh --build
docker compose --env-file .env -f compose.prod.yaml logs --tail 100 api
```

Výchozí deploy před buildem vytvoří zálohu. Pokud migrace selže, nová API verze
se nespustí. Databázové migrace automaticky nevracej zpět; oprav release nebo
obnov celou ověřenou zálohu.

## Stav, logy a bezpečné zastavení

```bash
docker compose --env-file .env -f compose.prod.yaml ps
docker compose --env-file .env -f compose.prod.yaml logs -f gateway
docker compose --env-file .env -f compose.prod.yaml logs -f api
docker compose --env-file .env -f compose.prod.yaml logs -f db
docker compose --env-file .env -f compose.prod.yaml restart api
docker compose --env-file .env -f compose.prod.yaml stop
```

`stop` zachová bind-mounted PostgreSQL, uploads i Caddy data. Nepoužívej
`down -v`, nemaž `database/postgres/` ani `uploads/`.

## Záloha

Dry-run a skutečná záloha:

```bash
./scripts/backup-vps.sh --dry-run
./scripts/backup-vps.sh
```

Skript krátce zastaví API zápisy, vytvoří custom-format `pg_dump`, samostatný
`uploads.tar.gz`, manifest s UTC časem/release a `SHA256SUMS`. Výsledek je v
`backups/<timestamp>/` s omezenými právy. Aktivní PostgreSQL datový adresář se
netaruje. `BACKUP_RETENTION_COUNT` standardně ponechá sedm posledních záloh.

Lokální disk VPS není off-site záloha. Hotovou složku po ověření checksumů
šifrovaně replikuj na oddělené úložiště.

Cron příklad pro denní zálohu ve 02:15:

```cron
15 2 * * * cd /srv/homeapp && ./scripts/backup-vps.sh >> /var/log/homeapp-backup.log 2>&1
```

Cron běží pod deployment uživatelem. Log rotuj a nepřidávej do něj `.env`.

## Obnova

Nejdřív ověř plán bez změny dat:

```bash
./scripts/restore-vps.sh --dry-run backups/20260723T021500Z
```

Skutečná obnova:

```bash
./scripts/restore-vps.sh backups/20260723T021500Z
```

Skript ověří manifest/checksumy a bezpečné cesty archivu, vyžádá text
`OBNOVIT`, vytvoří bezpečnostní zálohu současného stavu, zastaví gateway/API,
obnoví logical dump bez aplikačních zápisů, atomicky vymění uploads, aplikuje
aktuální migrace a provede readiness. Task-linked data i audity zůstávají
součástí celého PostgreSQL dumpu; neobnovuj jednotlivé tabulky.

## Troubleshooting

### DNS nebo certifikát

- Ověř A/AAAA z externí sítě a dostupnost 80/443.
- `docker compose --env-file .env -f compose.prod.yaml logs gateway` ukáže ACME
  chybu bez nutnosti zveřejnit tajemství.
- Pokud port drží jiný webserver, bezpečně jej přesuň nebo zastav; neměň Caddy
  na náhodný veřejný port.

### API není ready nebo migrace selhala

- Zkontroluj `db` health a API logy.
- Ověř, že `DATABASE_URL` používá host `db:5432` a odpovídá inicializované roli.
- Migraci opakuj jen po opravě příčiny:

  ```bash
  docker compose --env-file .env -f compose.prod.yaml run --rm migrate
  ```

- Nikdy nepoužívej `migrate dev` ani reset.

### Google origin mismatch nebo cookie

- Google origin i `WEB_ORIGIN` musí být přesné `https://<APP_DOMAIN>`.
- Rebuild gateway po změně `VITE_GOOGLE_CLIENT_ID`.
- Secure cookie vznikne jen přes HTTPS; API musí mít `TRUST_PROXY=true`.

### Upload permission denied

`uploads/` musí vlastnit numerické `APP_RUNTIME_UID:APP_RUNTIME_GID`. Oprav
vlastnictví vědomě na VPS a znovu spusť preflight; nemountuj uploads do gateway
a nepřidávej static route.

### PostgreSQL authentication failed

Již inicializovaný PGDATA si pamatuje původní roli a heslo. Změna `.env` sama
heslo uvnitř DB nezmění. Vrať správnou konfiguraci nebo heslo změň řízeným SQL
postupem po záloze; nemaž PGDATA.

### Disk je plný

Zastav nové uploady/deploy, ověř `df -h`, Docker logy a adresář `backups/`.
Nepromaž PostgreSQL datové soubory. Bezpečně aplikuj retention záloh, Docker
image pruning pouze po kontrole používaných image a přidej off-site kapacitu.
