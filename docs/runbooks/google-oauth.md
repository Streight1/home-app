# Google OAuth pro přihlášení

Life Admin používá Google Identity Services (GIS) pouze k ověření identity.
Nevyžaduje Google Client Secret, redirect endpoint ani oprávnění ke Kalendáři,
Gmailu, Disku či jinému Google API.

## Konfigurace Google Cloud

1. V Google Cloud Console vytvoř nebo vyber projekt.
2. V Google Auth Platform nastav branding a consent screen.
3. Vytvoř OAuth client typu **Web application**.
4. Do **Authorized JavaScript origins** přidej přesně
   `http://localhost:5173`.
5. Zkopíruj Client ID končící obvykle na `apps.googleusercontent.com`.
6. Hodnotu nastav jako `GOOGLE_CLIENT_ID` v kořenovém `.env`;
   `VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}` ji bezpečně převezme pro web.
7. Do `GOOGLE_ALLOWED_EMAILS` v kořenovém `.env` přidej vlastní e-mail. Seznam je
   oddělený čárkami a backend jej normalizuje přes `trim()` a lowercase.
8. Při `SINGLE_HOUSEHOLD_MODE=true` nastav stejnou adresu jako
   `SINGLE_HOUSEHOLD_OWNER_EMAIL`; další povolené adresy získají po prvním
   owner loginu roli MEMBER ve stejné domácnosti.
9. Pokud je consent screen v testovacím režimu, přidej účet mezi testovací
   uživatele podle nastavení projektu.

Client ID je veřejný identifikátor aplikace, nikoli Client Secret. Tato
implementace Client Secret nepoužívá a žádný nesmí být ve Vite konfiguraci.

## Lokální ověření

1. Spusť PostgreSQL, migrace a `pnpm dev` podle
   [lokálního vývoje](../development/local-development.md).
2. Otevři `http://localhost:5173/login`.
3. Ověř, že se vykreslí oficiální Google tlačítko a popup neblokuje prohlížeč.
4. Přihlas allowlistovaný účet a ověř přesměrování na `/app`.
5. Obnov stránku; platná serverová session musí přihlášení zachovat.
6. Odhlas se a ověř přesměrování na login.

V single-household režimu nejprve přihlas nakonfigurovaného ownera. Přidání
další adresy do allowlistu vyžaduje restart API; invitation e-mail se neposílá.

Google `credential` se smí pouze okamžitě odeslat login endpointu. Nekopíruj jej
do logu, DevTools poznámek ani issue a neukládej jej do web storage.

## Produkční odlišnosti

Pro produkci je nutný HTTPS origin, odpovídající `WEB_ORIGIN`, produkční Client
ID a neprázdný přesný allowlist. Session cookie pak používá `Secure=true`.
Produkční deployment a správa tajemství v této iteraci nejsou implementovány.

Při chybách pokračuj v [troubleshooting runbooku](troubleshooting.md).
