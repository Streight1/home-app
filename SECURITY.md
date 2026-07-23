# Bezpečnost Life Admin

## Základní model

- API je deny-by-default. Neoznačený endpoint vyžaduje platnou serverovou relaci.
- Jediný veřejný aplikační endpoint je `POST /api/v1/auth/google`.
- Google ID token ověřuje backend; Google `sub` je externí identita uživatele.
- Google token není aplikační relace a access/refresh tokeny Google API se neukládají.
- Session token má alespoň 256 bitů entropie, raw hodnota je jen v HttpOnly cookie
  a PostgreSQL ukládá pouze SHA-256 hash.
- Nebezpečné cookie requesty vyžadují přesný Origin a double-submit CSRF token.
- Přístup k household datům vyžaduje kontrolu členství a role přes
  `HouseholdAccessService`.
- `uploads/` se nikdy neposkytuje veřejným static file serverem.

Detailní tok a hranice popisuje
[autentizace a autorizace](docs/architecture/authentication-and-authorization.md).

## Tajemství a runtime data

- Skutečné `.env`, databázová data a uploady se necommitují.
- Jediný lokální `.env` je v kořeni workspace; aplikační podsložky nesmějí mít
  vlastní kopie s potenciálně odlišnými tajemstvími.
- Tajemství nepatří do Vite proměnných, logů, auditu, test fixtures ani dokumentace.
- Do databáze ani logů se neukládají Google credential, raw session token, cookies
  nebo CSRF token.
- `INTERNAL_HEALTH_TOKEN` je pouze backendové tajemství s minimálně 32 náhodnými znaky.
- Zálohy a runtime data popisuje
  [backup runbook](docs/runbooks/backup-and-restore.md).

## Hlášení bezpečnostní chyby

Bezpečnostní problém nezveřejňuj včetně exploitačních detailů nebo skutečných
dat. Informuj soukromě vlastníka repozitáře a uveď dotčenou verzi, reprodukční
kroky, dopad a navrženou mitigaci. Před opravou zneplatni uniklá tajemství nebo
relace, pokud je to relevantní. Projekt zatím nemá veřejný security contact ani
garantovanou dobu reakce.
