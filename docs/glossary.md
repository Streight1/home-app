# Slovník pojmů

## Household

Domácnost je hlavní hranice vlastnictví a autorizace budoucích životních dat.
Jeden uživatel může být členem více domácností.

## Household member

Vazba uživatele na domácnost s rolí `OWNER`, `ADMIN`, `MEMBER` nebo `VIEWER`.

## Active household

Domácnost použitá klientem jako aktuální kontext. V současné verzi API vrací
první členství; uživatelský výběr aktivní domácnosti zatím neexistuje.

## User

Lokální aplikační účet odvozený z backendem ověřené Google identity. Primárním
externím identifikátorem je Google subject, nikoliv e-mail.

## Session

Revokovatelná aplikační relace. Raw token je pouze v HttpOnly cookie a databáze
ukládá jeho SHA-256 hash.

## Google subject

Claim `sub` z ověřeného Google ID tokenu. Stabilně identifikuje Google účet pro
daný OAuth klientský kontext.

## Public endpoint

Endpoint dostupný bez aplikační session pouze po explicitním `@PublicEndpoint()`
a kontrole centrálního allowlistu. Aktuálně jde jen o Google login.

## Authenticated endpoint

Endpoint, který globální access guard zpřístupní pouze platné aktivní session
uživatele se statusem `ACTIVE`.

## Internal endpoint

Endpoint mimo veřejné aplikační API chráněný interním tokenem, nikoliv běžnou
uživatelskou session. Aktuálně jde o health endpointy.

## Storage object

Soubor uložený přes `StoragePort` pod serverem generovaným UUID klíčem. Původní
uživatelský název není fyzická cesta.

## Runtime data

Proměnlivá lokální data vznikající za běhu, zejména `database/postgres/` a
`uploads/`. Nejsou zdrojový kód a nesmějí se commitovat.

## Prisma migration

Verzovaný SQL krok v `apps/api/prisma/migrations/`, který bezpečně mění
databázové schéma. Není totéž co runtime PostgreSQL data.

## Audit log

Neměnný záznam důležité bezpečnostní nebo doménové události. Aktuálně se
zaznamenává úspěšný login a logout bez tokenů nebo cookies.
