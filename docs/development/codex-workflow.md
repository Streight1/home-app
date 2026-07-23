# Vývojový workflow pro Codex

Tento postup rozvádí závazná pravidla z kořenového `AGENTS.md`.

## Před změnou

1. Prohlédni stav repozitáře a runtime adresářů bez destruktivních příkazů.
2. Přečti `AGENTS.md`.
3. Přečti `docs/README.md`.
4. Přečti `docs/project-status.md`.
5. Přečti dokument příslušné feature.
6. Při změně UI přečti celý `DESIGN.md`.
7. Při architektonické změně přečti relevantní ADR.
8. Zkontroluj existující testy, konfiguraci a implementační hranice.
9. Neopakuj již implementované řešení v jiné části projektu.

Pokud je workspace špinavý, zachovej uživatelské změny. Nemaž `uploads/`,
`database/`, migrace ani `.env` a neresetuj databázi bez výslovného důvodu a
souhlasu.

## Během změny

1. Zachovej malé a jednoúčelové soubory.
2. Rozšiřuj existující feature modul nebo vytvoř nový feature modul pro novou oblast.
3. Neobcházej globální autentizaci ani centrální public allowlist.
4. Nevytvářej veřejný endpoint bez výslovného požadavku.
5. Nevkládej business logiku ani přímé requesty do React prezentační komponenty.
6. Nevkládej databázovou logiku přímo do controlleru.
7. Průběžně upravuj jednotkové, integrační nebo komponentové testy.
8. Nevytvářej dokumentaci pro funkci, která nebyla implementována.
9. Při změně endpointu, modelu nebo oprávnění aktualizuj odpovídající dokument současně.

## Před dokončením

1. Prohlédni celý diff a zkontroluj nesouvisející změny.
2. Aktualizuj feature dokumentaci.
3. Aktualizuj API katalog, pokud se změnilo API.
4. Aktualizuj datový model, pokud se změnilo Prisma schema.
5. Aktualizuj bezpečnostní dokumentaci, pokud se změnila oprávnění.
6. Aktualizuj lokální vývoj nebo runbook, pokud se změnilo spuštění či konfigurace.
7. Aktualizuj `CHANGELOG.md` pouze o skutečně implementované změny.
8. Aktualizuj `docs/project-status.md` skutečnými výsledky a omezeními.
9. Aktualizuj `docs/roadmap.md`, pokud se změnilo pořadí práce.
10. Spusť `pnpm docs:check` a `pnpm architecture:check`.
11. Spusť `pnpm environment:check`.
12. Spusť `pnpm check`.
13. Zkontroluj `git status --short`.
14. Ověř, že se necommitují runtime data, tajemství ani skutečné uživatelské soubory.

Neoznačuj příkaz za úspěšný, pokud nebyl skutečně spuštěn. Pokud prostředí Git
neposkytuje, uveď tuto skutečnost jako omezení místo vymyšleného výsledku.

## Závěrečný report

Report musí uvést:

- co bylo změněno;
- jaké dokumenty byly vytvořeny nebo aktualizovány;
- jaké migrace vznikly nebo se aplikovaly;
- jaké endpointy byly přidány, odstraněny nebo změněny;
- jaké testy byly přidány;
- které příkazy byly skutečně spuštěny a s jakým výsledkem;
- co zůstává nehotové nebo nebylo možné pravdivě ověřit.

Nevytvářej samostatný report soubor pro každý prompt. Dlouhodobé informace patří
do changelogu, project statusu, feature dokumentace a runbooků.
