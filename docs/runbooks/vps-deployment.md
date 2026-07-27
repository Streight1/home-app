# VPS staging deployment

Tento runbook je provozní rozcestník pro internetově dostupný single-VPS
staging. Hlavní cesta používá hotové GHCR image, named volumes a
`deployment/compose.yaml`. Původní `compose.prod.yaml` zůstává kompatibilní pro
bezpečnou migraci, ale není výchozí postup.

Podrobný první start je v
[one-command runbooku](one-command-deployment.md), registry a tagy v
[registry runbooku](container-registry.md) a data v
[backup runbooku](backup-and-restore.md).

## Předpoklady

- udržovaný 64bit Linux s Docker Engine a Compose pluginem;
- DNS A a případně AAAA záznam na VPS;
- veřejné porty 80/TCP a 443/TCP;
- SSH přístup pomocí klíče;
- deployment adresář například `/srv/homeapp/deployment`;
- privátní GHCR read token, pokud image nejsou veřejné.

Na VPS nejsou potřeba Node.js, pnpm, nvm, Prisma CLI, Git ani zdrojový
repozitář. Docker instaluj z distribučního nebo
[oficiálního Docker repozitáře](https://docs.docker.com/engine/install/);
nepoužívej neověřené `curl | sh`.

## Hardening

1. Použij odděleného neprivilegovaného deployment uživatele. Členství ve
   skupině `docker` je prakticky root oprávnění; Docker socket nevystavuj.
2. V SSH zakaž heslový root login a ponech klíče.
3. Firewallem povol SSH z očekávaných adres a veřejně jen 80/443. Porty 3000 a
   5432 neotvírej.
4. Pravidelně aktualizuj systém a Docker. Rootless Docker je volitelná další
   ochrana.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## DNS a Google OAuth

Nastav A record například `homeapp` na IPv4 VPS a AAAA jen při funkční IPv6.
Caddy potřebuje příchozí 80/443 pro ACME. Do Google Cloud Authorized
JavaScript origins přidej přesný origin:

```text
https://homeapp.example.cz
```

Současný Google Identity Services popup flow nepotřebuje backend redirect URI
ani Client Secret. Stejný veřejný Client ID používá browser i backend; ID token
ověřuje backend a účet musí být v `GOOGLE_ALLOWED_EMAILS`.

## První start

Na důvěryhodném stroji připrav deployment balíček obsahující:

```text
deployment/compose.yaml
deployment/Caddyfile
deployment/maintenance/
deployment/.env.example
deployment/secrets/README.md
```

Na VPS:

```bash
cd /srv/homeapp/deployment
cp .env.example .env
chmod 600 .env
mkdir -p secrets
chmod 700 secrets
# bezpečně vytvoř secrets/postgres_password,
# secrets/internal_health_token a secrets/mapy_api_key
chmod 600 secrets/*
docker compose config --quiet
docker compose up -d
docker compose ps
```

`docker compose up -d` stáhne image, vytvoří named volumes, opraví uploads
oprávnění, připraví neprivilegované runtime kopie secrets, nastartuje SCRAM
databázi, spustí `prisma migrate deploy`, počká na API health a teprve potom
spustí gateway.

## Ověření

```bash
docker compose ps
docker compose logs --tail 100 migrate
docker compose logs --tail 100 api
curl --fail --show-error --silent "https://homeapp.example.cz/" >/dev/null
curl --fail --show-error --silent "https://homeapp.example.cz/login" >/dev/null
```

V browseru ověř login, dashboard, databázový zápis a autentizovaný
upload/download. `/internal/health/ready` ani `/uploads/` nesmějí vrátit interní
data. Skutečný Google login nelze nahradit mockovaným testem.

## Aktualizace a rollback image

Mutable staging tag:

```bash
cd /srv/homeapp/deployment
docker compose up -d
```

Explicitnější varianta:

```bash
docker compose pull
docker compose up -d
```

Pro release změň v `.env` pouze `APP_IMAGE_TAG=vX.Y.Z` a doporučeně
`APP_PULL_POLICY=missing`, potom spusť stejný `up -d`. Aplikační rollback:

1. nastav předchozí release/SHA tag;
2. `docker compose up -d`;
3. ověř health a logy.

Vrácení image není rollback databázových migrací. Před release migrací vytvoř
ověřenou zálohu a používej dopředně kompatibilní schema změny.

## Stav, logy a zastavení

```bash
docker compose ps
docker compose logs -f gateway
docker compose logs -f api
docker compose logs -f db
docker compose restart api
docker compose stop
docker compose down
```

`stop` i `down` bez `-v` zachovají named volumes. Nikdy nepoužívej `down -v` na
provozním stacku.

## Přechod z legacy bind mountů

Migrační skript se spouští ještě ze stávajícího zdrojového workspace:

```bash
./scripts/migrate-vps-data-to-volumes.sh --dry-run
./scripts/migrate-vps-data-to-volumes.sh --execute
```

Vyžádá potvrzení `MIGROVAT`, vytvoří legacy logical backup, obnoví PostgreSQL a
uploads do nových named volumes, ověří dump, počet a SHA-256 manifest uploadů,
spustí migrace a až potom přepne gateway/API. Při selhání cutoveru se pokusí
znovu spustit legacy stack. Původní `database/postgres/`, `uploads/` a zálohu
nesmaže.

## Troubleshooting

### GHCR pull je odmítnutý

Pro privátní image proveď jednou `docker login ghcr.io` s read-only tokenem
`read:packages`. Token nepatří do Compose ani `.env`. Ověř `APP_IMAGE_TAG` a
oprávnění balíčku k repozitáři.

### Caddy nezíská certifikát

Ověř veřejné DNS, porty 80/443 a `docker compose logs gateway`. Neměň gateway na
náhodný veřejný port a neuvolňuj CSP wildcardem.

### Migrace selhala

```bash
docker compose logs migrate
docker compose ps
docker compose up -d
```

API se při neúspěšné migraci nespustí. Oprav image/schema nebo DB přístup a
zopakuj `up -d`; nepoužívej `migrate dev`, reset ani mazání volume.

### API není healthy

Ověř `db` health, API logy, existence secret souborů a jejich režim `0600`.
Health token se čte uvnitř API přes `INTERNAL_HEALTH_TOKEN_FILE` a nesmí se
kopírovat do gateway.

### Google origin nebo secure cookie

`WEB_ORIGIN` a Google origin musí být přesný HTTPS origin. Runtime
`GOOGLE_CLIENT_ID` změníš v `deployment/.env` bez rebuildu image a následně
spustíš `docker compose up -d gateway`. API musí mít production a
`TRUST_PROXY=true`.

### Upload permission denied

```bash
docker compose up volumes-init
docker compose up -d api gateway
```

Init service je idempotentní. Neupravuj named volume ručně, nemountuj uploads do
gateway a nepřidávej static route.

### PostgreSQL authentication failed

Inicializovaný volume si pamatuje původní roli a heslo. Pouhá změna secret
souboru heslo v DB nezmění. Vrať původní secret nebo změň heslo řízeně po
záloze; volume nemaž.

### Disk je plný

Zastav nové uploady a deploy, zkontroluj `df -h`, Docker logy a backup volume.
Nemaž PGDATA. Exportuj a ověř off-site zálohu, aplikuj retention a image pruning
jen po kontrole používaných image.
