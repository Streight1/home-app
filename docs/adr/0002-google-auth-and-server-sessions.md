# ADR 0002: Google Identity Services a serverové relace

- Stav: přijato
- Datum: 2026-07-12

## Kontext

Aplikace potřebuje jednoduché přihlášení pro omezený seznam uživatelů, bezpečné obnovení stránky a možnost okamžitě relaci nebo účet zneplatnit. Přihlášení nesmí automaticky udělovat přístup ke Google Kalendáři, Gmailu nebo Disku.

## Rozhodnutí

Frontend vykresluje oficiální tlačítko Google Identity Services v popup/callback režimu. Získaný ID token je pouze autentizační důkaz a ihned se posílá backendu. Backend používá oficiální `google-auth-library`, ověřuje podpis, issuer, audience, expiraci a povinné claimy. E-mailový allowlist se kontroluje až nad ověřenými claimy.

Trvalou identitou je Google `sub`, protože je stabilní pro daného issuer/client kontext; e-mail se může změnit a slouží jako aktualizovaný atribut a vstup allowlistu, nikoli jako primární identita.

Google ID token se nepoužívá jako aplikační relace. API vytváří vlastní náhodný token s 256 bity entropie, raw hodnotu posílá pouze v HttpOnly cookie a do PostgreSQL ukládá jen SHA-256 hash. Relaci lze proto revokovat, expirovat, svázat s deaktivovaným uživatelem a auditovat bez uložení znovupoužitelného tajemství. Cookie autentizaci doplňuje přesný Origin a double-submit CSRF token.

## Důsledky

Backend je jedinou důvěryhodnou hranicí pro identitu a allowlist. Únik databáze neposkytne přímo použitelné relační tokeny. Odhlášení vyžaduje zápis `revokedAt`, ne jen smazání cookie. Cena je databázový dotaz při ověření relace a správa expirací.

Případná budoucí oprávnění ke Google API budou samostatný consent a token lifecycle oddělený od přihlášení. Nebudou se přidávat do základního loginu a jejich access/refresh tokeny budou vyžadovat vlastní šifrované úložiště, scopes, revokaci a audit.
