# Pravidla dokumentace

## Hierarchie zdrojů pravdy

1. Skutečné chování: produkční kód.
2. Přesné databázové schéma: `apps/api/prisma/schema.prisma`.
3. Vizuální pravidla: `DESIGN.md`.
4. Agentní pravidla: `AGENTS.md`.
5. Důvody architektonických rozhodnutí: `docs/adr/`.
6. Aktuální stav: `docs/project-status.md`.
7. Funkční chování: `docs/features/*.md`.
8. API katalog: `docs/api/endpoints.md`.
9. Historie změn: `CHANGELOG.md`.
10. Provozní postupy: `docs/runbooks/*.md`.

Při rozporu ověř kód, konfiguraci a testy, potom oprav dokumentaci. Neopravuj
kód jen proto, aby odpovídal zastaralému textu, pokud to nebylo zadání.

## Kam informace patří

- Root README je stručný vstup a quick start, nikoliv detailní příručka.
- `CONTRIBUTING.md` popisuje lidský workflow a definici dokončení.
- `AGENTS.md` obsahuje pouze závazné agentní hranice a odkazy.
- `DESIGN.md` obsahuje pouze vizuální pravidla.
- Architecture dokumenty vysvětlují strukturu a současné technické chování.
- Feature dokument popisuje uživatelsky a doménově pozorovatelné chování.
- Runbook obsahuje konkrétní provozní postup.
- Project status odděluje implementované, částečné a neimplementované části.
- Roadmapa je budoucí pořadí, ne důkaz existence.

## Mapování změn

Pokud se změní:

- uživatelská funkce → `docs/features/<feature>.md`;
- endpoint → `docs/api/endpoints.md`;
- Prisma model → `docs/architecture/data-model.md`;
- autentizace nebo oprávnění → auth architecture a `SECURITY.md`;
- lokální konfigurace → `docs/development/local-development.md`;
- provozní postup → odpovídající runbook;
- architektonické rozhodnutí → nový nebo aktualizovaný ADR;
- skutečné chování → `CHANGELOG.md`;
- stupeň dokončení → `docs/project-status.md`;
- pořadí budoucí práce → `docs/roadmap.md`.

## Pravidla kvality

- Nevytvářej duplicitní návod; odkazuj na autoritativní dokument.
- Nedokumentuj zamýšlenou funkci jako implementovanou.
- Neuváděj úspěšnou kontrolu bez skutečného běhu.
- Nevkládej tajemství, skutečné osobní údaje nebo odkazy do runtime adresářů.
- Každý významný dokument přidej do `docs/README.md`.
- Po změně spusť `pnpm docs:check` a nakonec `pnpm check`.
