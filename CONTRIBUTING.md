# Přispívání do Life Admin

## Příprava prostředí

Použij Node.js 24 a pnpm verzi uvedenou v kořenovém `package.json`. Kompletní
instalaci, `.env` konfiguraci a start služeb popisuje
[lokální vývoj](docs/development/local-development.md).

## Workflow změny

1. Přečti `AGENTS.md`, dokumentační rozcestník a stav projektu.
2. Přečti dokument měněné feature a relevantní ADR.
3. Při UI změně přečti celý `DESIGN.md`.
4. Prohlédni existující kód, testy a konfiguraci; nevytvářej paralelní řešení.
5. Implementuj změnu v příslušném feature modulu a průběžně doplň testy.
6. Aktualizuj dokumentaci podle [dokumentačních pravidel](docs/development/documentation-rules.md).
7. Prohlédni diff, spusť cílené kontroly a nakonec `pnpm check`.
8. Zkontroluj `git status --short`, tajemství a runtime data.

Projekt nemá v tomto repozitáři stanovenou konvenci názvů větví ani formát
commit messages. Commity mají být malé, tematicky související a nesmějí míchat
nesouvisející reformátování.

## Databázové migrace

- Prisma schema je `apps/api/prisma/schema.prisma`.
- Novou migraci vytvoř pomocí `pnpm db:migrate -- --name popis-zmeny`.
- Již použitou migraci neupravuj a databázi automaticky neresetuj.
- Runtime PGDATA není migrace ani záloha.

Podrobnosti obsahuje
[průvodce migracemi](docs/development/database-migrations.md).

## Dokumentace

Dokumentuj pouze skutečně implementované chování. Každá změna chování patří do
`CHANGELOG.md`; stav a omezení do `docs/project-status.md`. Endpointy, datový
model, oprávnění a provozní postupy aktualizuj jen tehdy, když se jich změna
týká.

## Definice dokončené změny

- implementace a testy odpovídají zadání;
- feature, API, bezpečnostní a datová dokumentace nejsou zastaralé;
- changelog, project status a případně roadmapa odpovídají skutečnosti;
- `pnpm docs:check`, `pnpm architecture:check` a `pnpm check` prošly;
- `pnpm environment:check` prošel a nevznikl vnořený `.env` soubor;
- Git neobsahuje `.env`, PGDATA, uploady, tajemství ani skutečná uživatelská data.
