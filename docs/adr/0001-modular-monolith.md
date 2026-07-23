# ADR 0001: pnpm monorepo a modulární monolit

- Stav: přijato
- Datum: 2026-07-12

## Kontext

Life Admin bude sdružovat více životních agend, ale první iterace má malý tým, jednu databázi a společné bezpečnostní hranice. Frontend a API potřebují samostatné buildy a závislosti, přitom mají sdílet jednotné nástroje, verze a vývojové příkazy.

## Rozhodnutí

Používáme pnpm monorepo s aplikacemi `apps/web` a `apps/api`. API je modulární NestJS monolit. Hranice konfigurace, Prisma, autentizace, uživatelů, domácností, auditu a health checků jsou vyjádřené Nest moduly a dependency injection. PostgreSQL je jedna transakční autorita.

## Důsledky

Instalace, lockfile a kontroly jsou jednotné, ale web a API lze sestavit a nasazovat odděleně. Transakce prvního loginu zůstává lokální a nevyžaduje distribuovanou koordinaci. Budoucí agendy mají vzniknout jako moduly až s reálnými požadavky; aktuální řešení nevytváří předčasné služby ani event bus. Pokud některá oblast později získá odlišné škálování nebo bezpečnostní požadavky, jasná modulová hranice umožní její řízené oddělení.
