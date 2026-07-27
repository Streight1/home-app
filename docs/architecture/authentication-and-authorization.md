# Autentizace a autorizace

## Autentizace přes Google

Login stránka načte oficiální Google Identity Services skript a vykreslí
oficiální tlačítko v popup/callback režimu. One Tap a scopes pro Google API
nejsou zapnuté.

Frontend obdrží `credential` pouze v paměti, neprovádí nad ním důvěryhodné
rozhodnutí a ihned jej odešle na `POST /api/v1/auth/google`. Token se neukládá
do localStorage ani sessionStorage.

Backend pomocí `google-auth-library` ověří podpis, audience, expiraci a povinné
claimy `sub`, `email` a `email_verified`. E-mail normalizuje a porovná s přesným
serverovým allowlistem. V production nesmí být allowlist prázdný.

Google `sub` je externí identita uživatele. E-mail se může změnit a proto není
identifikátorem účtu. Google ID token není aplikační relace.

## Single-household admission

Volitelný režim z kořenového `.env` normalizuje owner/allowlist e-maily a
vyžaduje, aby owner byl v allowlistu. Owner login idempotentně založí nebo
bezpečně převezme jednu domácnost přes stabilní `SingleHouseholdBootstrap`;
další allowlistovaný účet se připojí jako MEMBER. Member před ownerem nesmí
založit paralelní domácnost. Existující owner s více vlastněnými domácnostmi se
automaticky neslučuje ani neodhaduje podle názvu.

Allowlist je admission kontrola při loginu. Jeho změna vyžaduje restart API;
odstranění adresy blokuje nový login, ale již vydanou session je nutné revokovat
nebo User deaktivovat. Plné invitations a správa rolí nejsou implementované.

## Serverová session

Po úspěšném loginu server generuje náhodný 256bitový token. Raw hodnota se pošle
jen v HttpOnly cookie; PostgreSQL ukládá pouze SHA-256 hash. Session má expiraci,
`lastUsedAt` a volitelné `revokedAt`. Disabled uživatel ani revokovaná nebo
expirovaná session neprojdou.

Session cookie používá `SameSite=Lax`, cestu `/`, omezenou životnost a v
production `Secure`. Logout session revokuje v databázi, zapíše audit a potom
vyčistí cookies.

## CSRF, Origin a CORS

Server po loginu nastaví samostatný náhodný CSRF token v ne-HttpOnly cookie.
Frontend jej pro nebezpečné metody kopíruje do `X-CSRF-Token`. Backend porovná
cookie a hlavičku timing-safe způsobem.

Každá nebezpečná metoda musí mít přesný `Origin` shodný s `WEB_ORIGIN`. Login je
z CSRF tokenu vyjmut, protože před session ještě cookie neexistuje, ale stále
vyžaduje Origin, JSON, DTO, body limit a rate limit. CORS povoluje jediný přesný
origin s credentials a úplnou používanou sadu metod `GET`, `HEAD`, `POST`,
`PUT`, `PATCH`, `DELETE` a `OPTIONS`; CORS samo není autentizace. Metody jsou v
jediné serverové konfiguraci a HTTP test kontroluje zejména preflight pro
`PUT`/`DELETE`.

## HTTPS reverse proxy

Single-VPS staging používá jeden HTTPS origin pro statický frontend i
`/api/v1`. Caddy je jediný veřejný listener; API má `TRUST_PROXY=true`, ale
CORS a Origin stále přijímají jen přesný `WEB_ORIGIN`. Proxy režim není
autorizace. Production session cookie je `Secure`, health token zůstává jen v
API secret mountu a `/internal/*` se přes gateway neproxyuje. Registry
deployment čte interní token přes `INTERNAL_HEALTH_TOKEN_FILE`; gateway ani
browser jej nedostanou.

Gateway při startu vloží veřejný Google Web Client ID do validovaného runtime
configu, ne Client Secret. Authorized JavaScript origins musí obsahovat
produkční HTTPS origin. Popup/callback flow nepotřebuje backend redirect URI a
nevytváří deployment auth bypass.

## Deny-by-default API

Globální access guard považuje endpoint bez metadata za `AUTHENTICATED`.
`@PublicEndpoint()` je runtime i repository kontrolou omezen na Google login.
`@InternalEndpoint()` používá `X-Internal-Health-Token` s minimálně 32 znaky a
timing-safe porovnáním. Běžná user session interní health automaticky neotevře.

Aktuální rozdělení cest uvádí [API katalog](../api/endpoints.md).

## Autorizace domácnosti

Autentizace potvrzuje uživatele; autorizace rozhoduje, zda smí pracovat s
konkrétní domácností. `HouseholdAccessService` kontroluje aktivní User,
`userId`, `householdId`, členství a minimální roli. Dotaz nesmí věřit household
ID zaslanému klientem bez této kontroly.

Neexistující cizí household a existující nepřístupný household vracejí stejnou
bezpečnou odpověď, aby neumožnily enumeraci.

Location a routing endpointy používají stejný globální deny-by-default guard.
Mapy API klíč je backendové tajemství bez `VITE_` prefixu. PRIVATE SavedPlace
je dostupné jen vlastníkovi; HOUSEHOLD místo aktivním členům. Default place
musí být pro uživatele viditelné. Cestovní plán lze vytvářet pouze pro aktivního
účastníka eventu a předchozí event se načítá v serverem odvozené domácnosti.
Navigation state ani localStorage nesmějí obsahovat adresu nebo souřadnice.
