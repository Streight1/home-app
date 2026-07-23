# Databázové migrace

## Zdroje pravdy

- Prisma schema: `apps/api/prisma/schema.prisma`
- migrace: `apps/api/prisma/migrations/`
- Prisma CLI konfigurace: `apps/api/prisma.config.ts`
- runtime PGDATA: `database/postgres/`

Schema a migrace jsou verzovaný zdrojový kód. PGDATA je lokální runtime stav a
nesmí se commitovat ani ručně upravovat.

## Generování klienta

```bash
pnpm db:generate
```

Generovaný ESM klient je ignorovaný Gitem a vzniká před typecheckem/buildem po
změně schématu nebo čisté instalaci.

## Vytvoření vývojové migrace

1. Zkontroluj běžící databázi a aktuální zálohu relevantních dat.
2. Uprav `schema.prisma`.
3. Spusť:

   ```bash
   pnpm db:migrate -- --name popis-zmeny
   ```

4. Prohlédni vygenerované SQL, indexy, cizí klíče a mazací chování.
5. Aktualizuj testy, [datový model](../architecture/data-model.md), changelog a project status.
6. Ověř migraci na nedestruktivním lokálním stavu a spusť `pnpm check`.

## Aplikace existujících migrací

```bash
pnpm db:migrate:deploy
```

Tento příkaz aplikuje pouze čekající verzované migrace a neprovádí reset.

## Zakázané postupy

- Neupravuj migraci, která již byla aplikována ve sdíleném nebo zachovávaném prostředí.
- Nespouštěj automatický reset jako součást startu aplikace.
- Nemaž `database/postgres/` kvůli opravě chyby bez explicitního rozhodnutí.
- Nekopíruj aktivní PGDATA jako primární zálohu; použij `pg_dump`.
- Nevydávej změnu schema bez migrace a aktualizované dokumentace za dokončenou.
