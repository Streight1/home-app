# Deployment

## Podporovaná topologie

HomeApp podporuje lokální vývoj přes `compose.yaml` a internetově dostupný
single-VPS staging přes `compose.prod.yaml`. Produkční topologie je:

```text
Internet :80/:443
        │
        ▼
gateway (Caddy + statický React build)
        │ /api/*
        ▼
api:3000 ─────────► db:5432
        │
        └──────────► uploads/
```

Gateway je jediná služba s publikovanými host porty. API a PostgreSQL jsou
dostupné jen v Docker síti `backend`; síť dovoluje API odchozí HTTPS pro Google
a volitelný Mapy provider, ale nemá host port. Same-origin frontend je sestaven
s `VITE_API_URL=/api/v1`. Caddy obsluhuje `/login`, `/app` a SPA fallback,
proxyuje jen `/api/*` a explicitně vrací 404 pro `/internal/*` a `/uploads/*`.

Reprodukovatelný VPS postup je ve
[staging runbooku](../runbooks/vps-deployment.md). Lokální `compose.yaml` zůstává
oddělený a není produkční definicí.

## Image

`apps/web/Dockerfile` je multi-stage build. Node 24 a pnpm z lockfile sestaví
Vite artefakt; runtime je oficiální Caddy image a neobsahuje Vite development
server ani workspace `node_modules`.

`apps/api/Dockerfile` má samostatné targety:

- `api` obsahuje production dependencies, sestavený NestJS, generovaný Prisma
  klient a migrace; běží pod neprivilegovaným UID/GID, s read-only root
  filesystemem a zapisuje jen do bind-mounted `uploads/` a `/tmp`;
- `migrate` obsahuje Prisma CLI a migrace, ale nespouští API. Používá výhradně
  `prisma migrate deploy`.

`.dockerignore` vylučuje `.env`, runtime data, dokumentaci, test fixtures,
Storybook a browser testy. Tajemství nejsou build argumenty. Do frontend buildu
vstupují jen veřejné `VITE_*` hodnoty a název CSRF cookie.

## Sítě, proxy a hlavičky

Caddy používá hostname z `APP_DOMAIN`, získává a obnovuje TLS certifikát a
ukládá stav do `caddy/data/` a `caddy/config/`. Konfigurace zapíná gzip/zstd,
omezení request body, proxy timeouty a CSP kompatibilní s lokálními assety,
Google Identity Services, Google avatar obrázky a autentizovanými blob preview.
`Cross-Origin-Opener-Policy: same-origin-allow-popups` zachovává Google popup.

Proxy standardně nastavuje bezpečné `X-Forwarded-*` hlavičky. API v production
vynucuje `TRUST_PROXY=true`, poslouchá na `0.0.0.0:3000`, CORS/Origin porovnává
s jediným `WEB_ORIGIN` a session cookie má `Secure` a `SameSite=Lax`.

Konfigurace vychází z oficiálního [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy),
[Caddy environment](https://caddyserver.com/docs/caddyfile/concepts#environment-variables)
a [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
kontraktu.

## Perzistence

Všechny stavové adresáře jsou bind mounty v deployment workspace:

```text
database/postgres/
uploads/
backups/
caddy/data/
caddy/config/
```

PostgreSQL používá přesný mount
`./database/postgres:/var/lib/postgresql`. Uploady jsou mountované pouze jako
`./uploads:/app/uploads` do API. Gateway k nim nemá filesystemový ani HTTP
přístup. Caddy data/config jsou persistentní, ale nejsou součástí aplikační
zálohy. Všechny runtime obsahy jsou ignorované Gitem.

## Environment

Jediným konfiguračním souborem je kořenový `.env`. Compose předává API jen
explicitně vyjmenované názvy. Gateway dostává pouze `APP_DOMAIN`,
`ACME_EMAIL` a limit request body. Databáze dostává pouze PostgreSQL názvy.
Interní health token, database URL a provider klíče nejsou dostupné gateway ani
frontend buildu.

`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, limity souborů,
`VITE_APP_ENV_LABEL` a název CSRF cookie jsou build-time kontrakt. Jejich změna
vyžaduje rebuild gateway image. `APP_ENV_LABEL` je pouze nenápadné prostředí
badge a není bezpečnostní kontrola.

## Migrace a start

Migrace neběží v každé API replice. `scripts/deploy-vps.sh` provede:

1. preflight konfigurace, disků, adresářů a portů;
2. standardně konzistentní zálohu;
3. build image;
4. start a health PostgreSQL;
5. jednorázový `migrate` target;
6. teprve po úspěšné migraci aktualizaci API a gateway;
7. interní readiness a veřejný HTTPS check.

Při selhání migrace se nový API kontejner nespustí. Skript nepoužívá
`down -v`, nemaže bind mounty a neprovádí automatický rollback databáze.

## Health a logy

PostgreSQL používá `pg_isready`. API healthcheck volá
`/internal/health/ready` uvnitř vlastního kontejneru s tokenem z process
environment. Gateway čeká na healthy API. Interní health cesty nejsou
proxyované na internet a token se nevypisuje do příkazové řádky ani gateway
environment.

Kontejnery logují na stdout/stderr s Docker `json-file` rotací 10 MiB a třemi
soubory. Aplikační pravidla nadále zakazují tokeny, cookies, provider klíče,
database URL, obsah uploadů a bankovní řádky v logu.

## Omezení

Jde o single-VPS staging, ne high-availability platformu. Výpadek VPS znamená
výpadek celé aplikace. Zálohy uložené jen na stejném disku nejsou dostatečná
ochrana před ztrátou serveru; po vytvoření se musí šifrovaně replikovat mimo
VPS. Monitoring, off-site backup transport a CI/CD nejsou automatizované.
