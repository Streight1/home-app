# Autentizace

## Stav

Implementováno a automatizovaně testováno s mockovaným Google verifierem. Login
se skutečným Google účtem nebyl v repozitářových kontrolách ověřen, protože
vyžaduje skutečné Client ID a interaktivní prohlížeč.

## Účel

Umožňuje přihlášení ověřeným Google účtem, vytvoření první domácnosti a bezpečné
udržení aplikační relace bez ukládání Google nebo session tokenu ve frontendu.
Neuděluje přístup ke Google API.

## Uživatelské scénáře

- Nepřihlášený uživatel otevře `/login` a použije oficiální Google tlačítko.
- Povolený ověřený účet získá session a přejde na `/app`.
- V běžném režimu první login vytvoří vlastní domácnost a `OWNER` členství.
- V single-household režimu nakonfigurovaný owner založí/převezme sdílenou
  domácnost a další allowlistovaný účet dostane v téže domácnosti `MEMBER`.
- Obnovení stránky ověří serverovou relaci přes `auth/me`.
- Odhlášení revokuje relaci v databázi a odstraní obě cookies.
- Neplatný, neověřený, zakázaný nebo disabled účet je odmítnut.

## Uživatelské rozhraní

Auth feature je v `apps/web/src/features/auth`. `LoginPage` používá compact
jednopanelovou a expanded dvousloupcovou kompozici, skládá login panel,
oficiální GIS tlačítko a přístupný chybový stav. `AnonymousRoute` přesměruje
přihlášeného uživatele pryč z loginu; `ProtectedRoute` nezobrazí dashboard před
dokončením kontroly session. API volají hooky nad centrálním klientem, nikoli
prezentační komponenty.

Google `credential` se po callbacku bez dekódování odešle backendu a nikam se
neukládá. API klient používá `credentials: "include"` a pro nebezpečné metody
přidává CSRF hlavičku z čitelné CSRF cookie.

## API

- `POST /api/v1/auth/google` je jediný veřejný aplikační endpoint.
- `GET /api/v1/auth/me` vyžaduje platnou serverovou session.
- `POST /api/v1/auth/logout` vyžaduje session, přesný Origin a CSRF token.

Úplné statusy a přístupové podmínky jsou v [katalogu endpointů](../api/endpoints.md).

## Datový model

Funkce používá `User`, `Household`, `HouseholdMember`, volitelný
`SingleHouseholdBootstrap`, `Session` a `AuditLog`.
Google identita se páruje přes unikátní `googleSubject` (`sub`), nikoli e-mail.
První provisioning proběhne v transakci. Session tabulka obsahuje pouze SHA-256
hash náhodného tokenu; úspěšný login a logout vytvářejí auditní událost.

## Autentizace a oprávnění

Backend ověřuje Google ID token pomocí `google-auth-library`, požaduje `sub`,
`email` a `email_verified === true` a aplikuje přesný normalizovaný allowlist.
Prázdný allowlist je povolen jen v developmentu. Uživatele se stavem `DISABLED`
nelze přihlásit ani použít jeho existující session.

Při `SINGLE_HOUSEHOLD_MODE=true` musí být normalizovaný owner v allowlistu a
název domácnosti nesmí být prázdný. Owner e-mail určuje jen admission/počáteční
roli; účet se stále hledá podle ověřeného `sub`. Member před inicializací ownera
dostane bezpečnou českou chybu a vlastní domácnost se mu nevytvoří.

Session cookie je `HttpOnly`, `SameSite=Lax`, má cestu `/` a v production je
`Secure`. Samostatná CSRF cookie není `HttpOnly`. Názvy obou cookies řídí
kořenové `SESSION_COOKIE_NAME` a `CSRF_COOKIE_NAME`; Vite předá browseru pouze
ne-citlivý název CSRF cookie. Globální access guard chrání
endpointy ve výchozím stavu; veřejná výjimka je vynucena přesnou cestou a metodou.

## Validace a chybové stavy

Login přijímá pouze JSON DTO s `credential` a odmítá další pole. Origin musí
přesně odpovídat `WEB_ORIGIN`; endpoint má limit požadavků a globální limit těla.
API vrací konzistentní JSON chybu se `statusCode`, bezpečným `code` a českou
`message`. Tokeny, cookies a login body se nelogují.

## Testy

Backend testy mockují Google verifier a pokrývají chybné claimy, allowlist,
opakovaný provisioning, single-household owner/member/převzetí, hash session,
expiraci, revokaci, disabled účet, Origin, CSRF a logout. HTTP testy ověřují
globální access policy. Frontend testy pokrývají
GIS kontejner, chybu skriptu, stav načítání, přesměrování po 401, profil a logout
s CSRF hlavičkou.

## Známá omezení

- Invitation workflow ani UI změny rolí nejsou implementované.
- Odstranění e-mailu z allowlistu samo nerevokuje existující session.
- Není implementována správa sessions ani automatický úklid expirovaných řádků.
- Reálné Google přihlášení vyžaduje manuální konfiguraci a prohlížeč.
- Produkční key management, monitoring a distribuovaný rate limit nejsou hotové.

## Budoucí možnosti

Přepínání domácností, správa zařízení a sessions a samostatné OAuth granty pro
budoucí Google API. Tyto granty nesmějí měnit login token na aplikační relaci.
