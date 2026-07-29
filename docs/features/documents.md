# Dokumenty

## Stav

Implementována použitelná dokumentová knihovna: upload jednoho souboru,
hierarchické složky, metadata/poznámky, hledání a stránkování, prezentační
seznam, adaptivní modály, náhled/download, archiv, koš, obnovení a bezpečné
trvalé odstranění přes storage deletion outbox.

## Účel

Modul spravuje soukromé dokumenty aktivní domácnosti. Logické složky nejsou
filesystem adresáře a veřejné odpovědi neobsahují `storageKey`, checksum ani
cestu. Budoucí faktury, smlouvy, majetek a vozidla se napojí vlastními join
tabulkami přes bezpečné `DocumentsFacade`.

## Uživatelské scénáře

- `OWNER`, `ADMIN` a `MEMBER` nahrají PDF, JPEG, PNG, TXT, DOCX nebo XLSX,
  zvolí typ/složku, datum, metadata a plain-text poznámky;
- uživatel prochází složky, hledá, řadí a volí 10/20/50/100 položek v interním
  workspace stavu;
- seznam identifikuje fakturu dodavatelem, shrnutím nákupu, referencí, datem a
  částkou místo technického filename, velikosti a statusu;
- preview, editace, přesun i potvrzení lifecycle akcí používají na desktopu
  Dialog a na mobilu full-screen Sheet/Dialog;
- archivace dokument pouze odloží; koš dovolí obnovení; permanent delete je
  možný výhradně z koše pro `OWNER`/`ADMIN` po zadání `SMAZAT`;
- `VIEWER` smí číst, filtrovat, zobrazit náhled a stahovat, ale nemůže mutovat.

## Uživatelské rozhraní

Seznam, koš, nový dokument, detail, preview a extraction jsou interní views pod
jedinou browserovou URL `/app`; UUID se do adresního řádku nezapisuje.
Desktopový seznam má sloupce Dokument, Datum, Částka, Složka a Akce. Sloupec
Dokument skládá `primaryLabel`, `secondaryLabel`, `referenceLabel` a badge typu.
Mobil používá samostatný kartový seznam bez MIME, checksumu, velikosti a
technického statusu; touch targety mají nejméně 44 px a layout neoverflowuje.

`DocumentListPresentationService` na backendu mapuje typová metadata do
bezpečného prezentačního modelu. Frontend `metadataJson` neinterpretuje.
Faktura preferuje `supplierName`, `purchaseSummary`, číslo faktury,
`issueDate`/document date a `totalAmountMinor + currencyCode`; při chybějících
údajích používá title nebo sanitizovaný filename. Receipt, contract a warranty
mají vlastní obdobná pravidla a ostatní typy konzistentní fallback.

## API

Všechny endpointy jsou `AUTHENTICATED`. Knihovna poskytuje CRUD prázdných
logických složek, read-only registr typů, upload/list/detail/update/move,
oddělenou archivaci, koš, preview/download a extrakci. Úplný kontrakt je v
[katalogu endpointů](../api/endpoints.md).

Seznam podporuje `page`, `pageSize`, `query`, `folderId`,
`includeSubfolders`, `type`, `status`, `createdFrom`, `createdTo`, `sortBy` a
`sortDirection`; výchozí je 20 aktivních položek `createdAt desc`. Koš má
samostatný `GET /api/v1/documents/trash`.

## Datový model

`Document` obsahuje household, aktuální i původní košovou složku, název,
description, plain-text notes, typ, JSONB metadata/schema/provenance, datum,
stav a lifecycle časy. Stavy jsou `ACTIVE`, `ARCHIVED`, `TRASHED`; koš ukládá
`trashedAt`, `trashedByUserId` a `trashedFromFolderId`.

`DocumentFile` vlastní interní storage klíč a technická metadata. Jeden dokument
má jeden aktivní soubor. `DocumentFolder` je logický adjacency tree do hloubky 10. `StoredFileDeletionTask` je outbox se stavy `PENDING`, `PROCESSING`,
`COMPLETED`, `FAILED`, počtem pokusů a bezpečným error code.

Invoice schema verze 2 přidává uživatelsky editovatelný `purchaseSummary`
(max. 300 znaků) a volitelné `lineItems`. Položky jsou verzovaná metadata, ne
finanční doménové entity. Částky jsou safe integer minor units, datum ISO bez
času, podporované měny `CZK` a `EUR`; neznámé klíče se odmítnou.

## Autentizace a oprávnění

Household ID odvozuje backend ze session a každý use case používá existující
`HouseholdAccessService`.

| Operace                                     | OWNER/ADMIN | MEMBER | VIEWER |
| ------------------------------------------- | ----------- | ------ | ------ |
| seznam, detail, složky, preview, download   | ano         | ano    | ano    |
| upload, update, přesun, archiv/koš/obnovení | ano         | ano    | ne     |
| správa prázdných složek                     | ano         | ano    | ne     |
| permanent delete dokumentu ve stavu TRASHED | ano         | ne     | ne     |

Cizí nebo neexistující dokument vrací stejnou obecnou 404.

## Lifecycle a storage odstranění

- **Archivace:** stav `ARCHIVED`; soubor i složka zůstávají a operace je snadno
  vratná samostatným restore archive.
- **Koš:** stav `TRASHED`; fyzický soubor zůstává, původní složka se zapamatuje.
  Restore ji použije, pokud stále existuje, jinak vrátí dokument do kořene.
- **Trvalé smazání:** pouze z koše. Databázová transakce vytvoří
  `StoredFileDeletionTask`, odstraní dokumentová/extrakční data a zapíše
  minimální audit `{documentId,type}`. Worker následně odstraní objekt přes
  `StoragePort`; selhání označí task pro omezený retry. Klient ani běžný log
  storage klíč nedostane.

Tím pád mezi databází a storage neztratí informaci nutnou k dokončení cleanupu.
Outbox je interní, nikoli veřejná API entita.

## Validace a chybové stavy

Backend kontroluje MIME, příponu, detekovaný obsah, magic bytes, neprázdnost a
`MAX_UPLOAD_BYTES`. DOCX/XLSX musí být konkrétní OOXML kontejnery; obecný ZIP,
HTML, SVG, JavaScript a executable se odmítnou. Uživatelský filename nikdy
netvoří cestu. DB chyba po zápisu vyvolá kompenzační storage cleanup.

Složky zakazují cykly, přesun do potomka/cizí household, hloubku nad 10 a
duplicitní normalizovaný název. Neprázdnou složku nelze smazat. Edit modal při
neuložené změně vyžaduje vlastní přístupné potvrzení, nikoli `window.confirm`.

## Testy

Backend pokrývá prezentační fallbacky faktur, zákaz `storageKey`, role koše a
permanent delete, platný stav, původní složku/root fallback, minimální audit a
retry outboxu vedle upload/household/storage testů. Frontend pokrývá dodavatele,
summary, formát částky, absenci technických sloupců, desktop/full-screen preview,
dirty edit potvrzení, move dialog, koš, roli member a potvrzení `SMAZAT`.

## Známá omezení

- jeden dokument má právě jeden aktivní soubor;
- PDF/obrázek/TXT nemají anotace; Office preview není implementované;
- Range requesty nejsou implementované;
- deletion worker je in-process; task v `PENDING`/`FAILED` se zpracuje po startu
  procesu, ale není samostatný durable worker service;
- lokální storage je pro jeden aplikační server;
- aktivní domácnost je stále první členství bez uživatelského přepínače.

## Budoucí možnosti

Verzování, fulltext, štítky, e-mailový import a NAS/S3 jsou samostatné iterace.
Budoucí domény budou vlastnit explicitní vazební tabulky, nikoli polymorfní
`entityType/entityId`.

Provedená údržba používá existující document picker a veřejný
`DocumentsFacade`. `MaintenanceOccurrenceDocument` ukládá explicitní FK a typ
vazby; nevzniká druhý upload ani kopie document metadata.
