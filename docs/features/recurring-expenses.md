# Opakované výdaje

## Stav

Implementována detekce kandidátů a ručně potvrzená analytická evidence.

## Účel

Oblast hledá pravidelně se opakující podobné výdaje. Nejde o bankovní trvalý
příkaz, předplatné se automaticky neruší a nevzniká automatický převod.

## Uživatelské scénáře

- Uživatel zkontroluje kandidáta, četnost, typickou částku a sílu vzoru.
- MEMBER kandidáta potvrdí nebo odmítne; potvrzený výdaj upraví, pozastaví,
  ukončí nebo archivuje.
- VIEWER vidí pouze read-only přehled.

## Uživatelské rozhraní

Finance / Opakované platby oddělují návrhy a potvrzenou evidenci. Karty mají
textový popis četnosti, počet výskytů a dostupné akce; mobil nemá tabulku ani
horizontální overflow.

## API

Autentizované endpointy jsou `GET /api/v1/finance/recurring-candidates`,
confirm/dismiss kandidáta, `GET /api/v1/finance/recurring-expenses`, PATCH a
archive potvrzeného výdaje.

## Datový model

`RecurringExpenseCandidate` drží účet, normalizovaného obchodníka, měnu,
typickou `BigInt` částku, toleranci, četnost, další datum, sílu a počet důkazů.
`RecurringExpense` je uživatelem potvrzený analytický záznam. Měny se neslučují.

## Autentizace a oprávnění

Data jsou household-scoped. VIEWER čte, MEMBER/ADMIN/OWNER potvrzuje, odmítá,
upravuje a archivuje. Cizí ID se chová jako neexistující.

## Validace a chybové stavy

Detekce vyžaduje nejméně tři EXPENSE stejného účtu, měny a přesného
`merchantNormalizedName`, podobné částky do tolerance a interval odpovídající
týdnu, měsíci, čtvrtletí nebo roku. Transfer, karetní splátka, refund a
nepravidelný či částkově rozkolísaný vzor kandidáta nevytvoří.

## Testy

Testy pokrývají minimum výskytů, měsíční interval, další datum, částkovou
toleranci, irregular rejection, role a confirm/dismiss UI. Syntetické fixtures
neobsahují bankovní údaje.

## Známá omezení

Síla vzoru není pravděpodobnost ani garance budoucí platby. Detektor nepoužívá
fuzzy slučování obchodníků a neplánuje platbu v bance.

## Budoucí možnosti

Uživatel může později nastavit připomínku nebo očekávaný závazek; automatická
akce vyžaduje samostatný bezpečnostní návrh.
