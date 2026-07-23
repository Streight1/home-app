# Záloha a obnova

Projekt má ručně nebo schedulerem spustitelné VPS skripty, ale nemá
automaticky nainstalovaný backup scheduler ani off-site transport. Před prací
ověř cílové prostředí a u důležitých dat nejprve nacvič obnovu na oddělené
instanci.

## VPS skripty

`scripts/backup-vps.sh` krátce zastaví API zápisy, vytvoří custom-format
`pg_dump`, `uploads.tar.gz`, manifest release/UTC času a `SHA256SUMS` do
`backups/<timestamp>/`. Aktivní `database/postgres/` se nekopíruje. Retention
řídí `BACKUP_RETENTION_COUNT`; samotný scheduler a šifrovaný off-site přenos
musí nakonfigurovat provozovatel.

`scripts/restore-vps.sh` vyžaduje explicitní cestu a textové potvrzení, ověří
checksumy i cesty archivu, vytvoří novou bezpečnostní zálohu, zastaví
gateway/API, obnoví celý dump a uploads, aplikuje aktuální migrace a teprve
potom znovu spustí aplikaci. Oba skripty podporují `--dry-run`. Úplný postup je
ve [VPS deployment runbooku](vps-deployment.md).

## Co tvoří jednu zálohu

- logická PostgreSQL záloha vytvořená pomocí `pg_dump`;
- samostatný archiv obsahu `uploads/`, jakmile aplikace začne soubory používat;
- záznam verze aplikace a okamžiku pořízení.

`database/postgres/` je aktivní PGDATA, nikoli záloha. Nekopíruj jej za běhu a
neobnovuj databázi nahrazením tohoto adresáře.

## PostgreSQL záloha

Na lokálním vývoji s hodnotami načtenými z kořenového `.env`:

```bash
set -a
. ./.env
set +a
mkdir -p backups
docker compose exec -T db pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  --no-privileges > backups/life-admin.dump
pg_restore --list backups/life-admin.dump > /dev/null
```

Složka `backups/` není určena ke commitu; zálohu chraň podle citlivosti dat a
ukládej mimo pracovní kopii. Příkaz `pg_dump` poskytne konzistentní logickou
zálohu bez kopírování aktivního PGDATA.

## Záloha uploadů

Autentizovaný dokumentový upload používá storage root `uploads/`. Během
archivace zastav aplikační zápisy nebo použij snapshot úložiště. Potom vytvoř
archiv například:

```bash
tar --create --file backups/life-admin-uploads.tar uploads
```

Databázovou zálohu a archiv uploadů označ stejným časem. Dokumentové objekty
jsou pod serverovými UUID segmenty; původní názvy nesmějí být rekonstruovány
jako cesty. Záloha musí držet PostgreSQL metadata a uploady ze stejného
konzistentního okamžiku, jinak mohou vzniknout osiřelé soubory nebo metadata.
Stejná PostgreSQL záloha musí zahrnout také logické složky, typová metadata a
extraction job/result historii i `StoredFileDeletionTask`; tyto entity se
samostatně z uploadů neobnoví. Před snapshotem je vhodné pozastavit mutace a
nechat dokončit rozpracované deletion tasky, jinak musí obnovená aplikace outbox
bezpečně zpracovat před kontrolou konzistence.

Finance ledger je pouze v PostgreSQL. Konzistentní dump musí společně obsahovat
účty, kategorie, transakce, transfery, document joiny a audit. Neobnovuj pouze
jednu stranu transferu nebo samostatnou transakční tabulku; porušila by se
ledgerová integrita. Částky v dumpu jsou minor-unit `BigInt`, nikoli měnové
floaty.

Dump zachová také importní historii, profily, normalizované řádky a pravidla
kategorizace. Dočasné CSV pod `uploads/finance-imports/temporary/` není záloha a
po commit/cancel/expire má zmizet. Pokud snapshot zachytí rozpracovanou session,
po obnově ji buď bezpečně dokonči, nebo zruš; nekopíruj CSV mimo `StoragePort`.

## Obnova PostgreSQL

Obnova je destruktivní vůči cílovým datům, proto se běžně provádí do nové,
prázdné databáze:

```bash
createdb --host localhost --username life_admin life_admin_restore
pg_restore \
  --host localhost \
  --username life_admin \
  --dbname life_admin_restore \
  --no-owner \
  --no-privileges \
  backups/life-admin.dump
```

Poté nastav dočasnou `DATABASE_URL` na obnovenou databázi, spusť readiness a
aplikační testy a teprve po ověření plánuj přepnutí. Příkazy přizpůsob cílovému
serveru; heslo nezapisuj do dokumentace ani historie shellu.

## Obnova uploadů

Uploady obnov pouze do prázdného, nepřístupného storage rootu se serverovými
oprávněními. Před spuštěním aplikace ověř, že žádná cesta neuniká z rootu a že
databázová metadata odpovídají stejné záloze. `uploads/` nikdy nevystavuj přes
static file server.

## Ověření zálohy

- `pg_restore --list` musí archiv přečíst;
- testovací obnova musí projít migracemi/readiness a kontrolou počtů klíčových
  entit;
- vzorek uploadů musí jít načíst pouze přes storage službu;
- po startu musí být outbox deletion tasků buď dokončený, nebo explicitně
  zkontrolovaný; storage objekt určený k odstranění není automaticky orphan;
- kontrolní download musí projít přes autentizovaný documents endpoint a
  household autorizaci, nikdy přes `/uploads`;
- proces obnovy pravidelně nacvičuj. Samotná existence souboru není důkaz zálohy.
- staging zálohu po ověření přenes šifrovaně mimo VPS; disk stejného serveru
  nechrání před jeho ztrátou.
