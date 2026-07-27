# Deployment secrets

V tomto adresáři vytvořte před prvním startem tři soubory bez koncovky:

- `postgres_password` – náhodné heslo PostgreSQL,
- `internal_health_token` – náhodný token s nejméně 32 znaky,
- `mapy_api_key` – backendový Mapy.com klíč; při vypnuté integraci může být
  soubor prázdný zástupný text, například `not-configured`.

Soubory nastavte na režim `0600`. Jejich obsah se nesmí commitovat,
kopírovat do image, zapisovat do `deployment/.env` ani vypisovat do logu.
Compose je připojí pouze root init službě a PostgreSQL. `volumes-init` při
každém startu připraví read-only kopie s runtime UID/GID pro API, migraci a
maintenance; ruční `chown` source secrets ani runtime adresářů není potřeba.
Aplikace dává variantě `*_FILE` přednost před kompatibilním environment
fallbackem.
