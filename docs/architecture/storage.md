# Storage a runtime data

## Upload root

`uploads/` je lokální runtime kořen pro uživatelské dokumenty. Git sleduje
jen `.gitkeep`. API neregistruje static file middleware a neexistuje veřejná
`/uploads`, `/static/uploads` ani podobná cesta.

## Storage abstraction

`StoragePort` podporuje zápis Bufferu nebo streamu do volitelného serverového
adresářového scope, čtení streamu, existenci,
metadata a odstranění. `LocalFileStorageService` je současný adaptér. Aplikační
logika má v budoucnu záviset na portu, ne na lokálních cestách.

Lokální implementace:

- generuje fyzický název jako UUID;
- nikdy nepoužívá původní uživatelský název jako cestu;
- přijímá jen validní storage klíč, ne absolutní cestu;
- odmítá `..` a únik mimo upload root;
- kanonicky kontroluje každý adresářový segment a odmítá symlink únik;
- nepřepisuje existující cíl;
- zapisuje exkluzivní dočasný `.uploading` soubor s omezeným módem;
- po úspěchu atomicky zveřejní finální jméno;
- po chybě uklidí dočasný i případný nedokončený finální soubor;
- vynucuje `MAX_UPLOAD_BYTES`.

Při startu služba vyřeší relativní `UPLOAD_ROOT` vůči workspace, bezpečně
vytvoří adresář a ověří zapisovatelnost. Nespoléhá na aktuální pracovní adresář.

## Dokumentové soubory

Dokumentový use case zapisuje do interní struktury:

```text
documents/<householdUuid>/<documentUuid>/<serverGeneratedUuid>
```

Všechny proměnné segmenty jsou UUID vytvořené nebo ověřené serverem. Původní
filename je pouze databázové metadata. Upload nejprve validuje typ a obsah,
spočítá SHA-256 a teprve potom zapisuje. Pokud následná databázová transakce
selže, uložený soubor se kompenzačně odstraní.

Download endpoint:

1. vyžadovat platnou session;
2. načíst household identitu souboru z databáze;
3. ověří členství a roli;
4. načte stream přes `StoragePort`;
5. nastaví bezpečné Content-Type, Content-Length, Content-Disposition a
   `nosniff`.

`uploads/` stále není static directory a filesystem ani `storageKey` se v API
response neobjevují.

Preview i download jsou autentizované endpointy nad stejným `StoragePort`.
Preview dovolí inline jen PDF, JPEG, PNG a plain text; download je vždy
attachment. Frontend používá credentialed Blob a object URL po použití revokuje.
Range requesty nejsou v této verzi implementované.

CSV bankovních importů používá oddělený relativní scope
`finance-imports/temporary/<household>/<session>/<server UUID>`. Původní název
je jen omezené metadata. CSV není static obsah, raw storage key se nevrací a
commit, cancel i expirační cleanup objekt odstraní přes `StoragePort`. Historie
zachová checksum a agregované počty, nikoli původní CSV.

Archivace ani přesun do koše fyzický objekt nemažou. Permanent delete je
povolen jen z koše. Databázová transakce nejprve vytvoří
`StoredFileDeletionTask`, odstraní dokumentová data a zachová minimální auditní
tombstone. In-process worker následně smaže objekt přes `StoragePort`; selhání
uloží pouze bezpečný error code a task lze omezeně opakovat. Storage klíč se
nevypisuje do běžného logu ani API. Záloha musí počítat s rozpracovanými outbox
tasky a po obnově je nechat bezpečně dokončit.

Extrakční modul neimportuje storage implementaci. `DocumentsFacade` ověří roli
a household dokumentu a potom poskytne interní stream extractor adapteru. PDF
adapter zachová textové bloky a layout uvnitř procesu; raw text a kandidáti jsou
databázová data, nikoli soubory v upload rootu. Externí OCR/AI adapter není
zapnutý, takže data aktuálně neopouštějí server.

## PostgreSQL runtime data

`database/postgres/` je bind-mounted PGDATA PostgreSQL. Je ignorované Gitem,
nesmí se ručně upravovat ani mazat za běhu. Prisma schema a verzované migrace v
`apps/api/prisma/` jsou zdrojový kód a nejsou runtime databázová data.

## VPS perzistence

Produkční Compose používá bind mounty
`./database/postgres:/var/lib/postgresql` a `./uploads:/app/uploads`.
`uploads/` je připojené pouze k API; Caddy image ani kontejner jej nemají
namountované a gateway vrací pro `/uploads/*` explicitní 404. Caddy TLS stav je
oddělený v `caddy/data/` a `caddy/config/`; konzistentní aplikační záloha
obsahuje logical PostgreSQL dump a archiv uploadů, nikoli tar aktivního PGDATA.

Preflight vytváří `database/postgres/`, `uploads/`, `backups/`,
`caddy/data/` a `caddy/config/`. API běží pod
`APP_RUNTIME_UID:APP_RUNTIME_GID`, takže vlastnictví upload rootu musí odpovídat
těmto číslům. Všechny runtime obsahy jsou ignorované Gitem.

## Budoucí NAS nebo S3

Přechod vyžaduje nový storage adaptér, konfiguraci, bezpečné credentials a
migrační provozní postup. Port umožní zachovat aplikační logiku, ale migrace dat
a konzistence s PostgreSQL budou samostatný projekt. NAS ani S3 dnes nejsou
implementované. Současný staging je záměrně single-VPS a nemá horizontální API
repliky.
