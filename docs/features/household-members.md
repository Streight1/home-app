# Členové sdílené domácnosti

## Stav

Implementován jednoduchý volitelný single-household režim a read-only seznam
již přihlášených členů. Invitation workflow není implementovaný.

## Účel

Připojit nakonfigurované Google účty do jedné domácnosti bez pozvánkových
tokenů, e-mailů nebo paralelních domácností.

## Uživatelské scénáře

- nakonfigurovaný vlastník založí nebo bezpečně převezme sdílenou domácnost;
- další allowlistovaný účet se po přihlášení připojí jako MEMBER;
- Nastavení ukáže aktivní členy a role a dovolí upravit kalendářovou barvu;
- přidání účtu do allowlistu se projeví po restartu API.

## Uživatelské rozhraní

Sekce „Členové domácnosti“ zobrazuje jméno, avatar, e-mail, roli a barevný
picker z osmi sémantických Aurora tokenů. Vysvětluje, že přístup se nyní
nastavuje konfigurací serveru. Nenabízí pozvánky ani změny rolí a nezobrazuje
cestu k `.env`.

## API

`GET /api/v1/household/members` je autentizovaný, household-scoped a vrací
bezpečný souhrn včetně `calendarColorToken`. Autentizovaný
`PATCH /api/v1/household/members/:userId/calendar-color` přijme pouze pevný
allowlist tokenů.

## Datový model

`SingleHouseholdBootstrap` je stabilní pointer na household; nehledá se podle
názvu. `HouseholdMember` dál používá role OWNER/ADMIN/MEMBER/VIEWER, unikátní
kombinaci household/user a `calendarColorToken`. Migrace doplní chybějící barvy
deterministicky; barva se nekopíruje do událostí.

## Autentizace a oprávnění

Google `sub` zůstává identitou. Normalizovaný owner e-mail určuje pouze
admission a počáteční OWNER roli; ostatní allowlistované účty jsou MEMBER.
Member před prvním owner loginem dostane `HOUSEHOLD_OWNER_NOT_INITIALIZED`.
Člen mění vlastní barvu. `OWNER`/`ADMIN` může změnit barvu jiného člena;
`MEMBER` tím nezískává možnost měnit jeho bezpečnostní roli.

## Validace a chybové stavy

Při zapnutém režimu je owner i název povinný a owner musí být v allowlistu.
Owner s více vlastněnými domácnostmi se automaticky neslučuje a login bezpečně
odmítne odhad. Opakovaný i souběžný login je idempotentní.

## Testy

Testy pokrývají owner bootstrap/převzetí, MEMBER stejné householdId, login před
ownerem, více owner domácností, opakování, identity podle `sub`, bezpečný
members response a serverový color allowlist.

## Známá omezení

Odstranění e-mailu z allowlistu blokuje nový login, ale samo nerevokuje již
existující session. Pro okamžitý zákaz je nutné deaktivovat User nebo revokovat
sessions provozním postupem.

## Budoucí možnosti

Plná správa členů, pozvánky a změny rolí vyžadují samostatný bezpečnostní návrh.
