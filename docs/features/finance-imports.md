# Import bankovních a karetních CSV

## Stav

Implementováno pro textové CSV/TSV-like soubory, běžné účty a kreditní karty.

## Účel

Průvodce převádí uživatelem zkontrolovaný bankovní nebo karetní výpis na
idempotentní ledger transakce. Nenahrazuje bankovní API, import PDF/XLSX ani
automatické účetnictví.

## Uživatelské scénáře

- Uživatel vybere účet, nahraje CSV a zkontroluje detekovaný formát.
- Ručně namapuje datum, částku, směr pohybu a volitelná bankovní pole.
- V náhledu opraví zahrnutí řádků, kategorie a možné duplicity.
- Kreditní refund lze ponechat jako `REFUND`; splátku uživatel výslovně převede
  na interní transfer ze zdrojového účtu.
- Rozpracovaný import lze zrušit. Historie uchová souhrn, nikoli CSV obsah.

## Uživatelské rozhraní

Finance workspace obsahuje sekci Importy s pěti kroky Soubor, Formát, Mapování,
Náhled a Výsledek. Desktop používá tabulkový náhled, compact režim samostatný
seznam a sticky-safe ovládání. Chyba není zaměněna za prázdný stav.

## API

Autentizované endpointy pod `/api/v1/finance/imports` vytvářejí session,
konfigurují formát/mapování, stránkují preview, upravují řádky, commitují nebo
ruší import. Profily jsou pod `/api/v1/finance/import-profiles`. Mutace používají
CSRF. Přesný seznam je v [API katalogu](../api/endpoints.md).

## Datový model

`FinanceImportSession` vlastní stav a počty, `FinanceImportRow` pouze mapovaná
normalizovaná pole a validační kódy a `FinanceImportProfile` znovupoužitelné
mapování. `FinancialTransaction.importRowId` je unikátní idempotency hranice.
CSV je dočasně uloženo přes `StoragePort` pod serverem generovaným klíčem.

## Autentizace a oprávnění

OWNER, ADMIN a MEMBER mohou importovat do účtu své domácnosti. VIEWER může
číst historii. Cizí účet nebo import používá stejnou obecnou 404 hranici.

## Validace a chybové stavy

Podporuje UTF-8, UTF-8 BOM, ručně volitelné Windows-1250, čárku, středník,
tabulátor, česká/ISO data a přesné minor units. Odmítá prázdné, binární,
příliš velké a nadlimitní soubory. Detekce je návrh, nikoli automatický commit.
Deduplikace používá hash souboru, externí ID a opatrný fingerprint.

## Testy

Unit testy pokrývají kódování, parser, decimal comma, datumy, debit/credit,
invert sign, fingerprint, kartu, storage hranici a idempotentní model.
Komponentové testy pokrývají file picker, mapování, mobilní preview, explicitní
zahrnutí možné duplicity a povinný výběr zdrojového účtu před zaúčtováním
splátky kreditní karty.

## Známá omezení

Parser načte obsah omezeného souboru do paměti po bezpečné kontrole velikosti;
limit řádků brání neomezenému růstu. Automatické párování karetní splátky se
nedělá podle textu. Import XLS/XLSX, PDF a bankovní API nejsou podporované.

## Budoucí možnosti

Bankovní provider port, progres velkých batchů a další explicitně testované
profilové šablony lze doplnit bez změny ledgeru.
