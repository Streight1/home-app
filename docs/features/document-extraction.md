# Vytěžování dat z dokumentů

## Stav

Implementována modulární, layout-aware extrakční pipeline V2 pro faktury v PDF
s použitelnou textovou vrstvou. Kandidáty lze reviewovat a potvrdit; OCR obrázků
a skenů má explicitní stav `OCR_NOT_CONFIGURED` a nevytváří falešná data.

## Účel

Pipeline připravuje návrhy strukturovaných údajů. Návrh nikdy automaticky
nepřepisuje ruční ani dříve potvrzenou hodnotu. Každý kandidát má raw a
normalizovanou hodnotu, confidence 0–1, důvody confidence, stránku, zdrojovou
oblast a review stav.

## Audit původního řešení a příčina slabé kvality

Původní PDF adapter volal `getTextContent()`, ale textové položky spojil do
jediného plain textu. Souřadnice `transform`, rozměry a pořadí bloků zahodil.
Structured extractor následně hledal několik regulárních výrazů ve spojených
řádcích. Neexistovala rekonstrukce řádků, sloupců, tabulek ani rozlišení oblastí
stránky. Dodavatel byl první labelový hit, line items nebyly podporované a
confidence byla pevná podle přítomnosti labelu. Image adapter pouze hlásil
nenakonfigurované OCR.

To je doložitelná příčina nízkého počtu i kvality polí: informace o vztahu
label–hodnota a tabulkovém layoutu byly odstraněny ještě před extrakcí. Nešlo o
selhání Google loginu, storage ani Prisma vrstvy.

## Uživatelské scénáře

- `MEMBER` nebo vyšší spustí job; endpoint vrátí `202` a zpracování proběhne
  mimo dlouhý HTTP request;
- frontend omezeně polluje a skončí při finálním stavu nebo timeoutu;
- uživatel porovná potvrzenou a navrženou hodnotu, návrh přijme, upraví nebo
  odmítne;
- „Přijmout bezpečné návrhy“ přijme pouze pole s confidence alespoň 0,85, která
  dosud nemají potvrzenou hodnotu;
- nový běh vytvoří nový job a zachová předchozí review historii;
- sken nebo obrázek bez OCR provideru skončí konečným `OCR_NOT_CONFIGURED` a UI
  nabídne ruční zadání.

## Uživatelské rozhraní

Interní extraction view pod `/app` používá na desktopu náhled vlevo a
skupiny Dodavatel, Identifikace faktury, Data, Částky, Platba a Položky vpravo.
Nízká confidence má textové varování; interní důvody se překládají do češtiny a
zdrojová oblast uvádí stránku a souřadnice. Mobil přepíná Náhled/Údaje a
zobrazuje neuložené změny. Barva není jediný nositel stavu.

## API

- `POST /api/v1/documents/:documentId/extractions` — nový job, `202`;
- `POST /api/v1/documents/:documentId/extractions/:jobId/retry` — nový běh,
  `202`;
- `GET /api/v1/documents/:documentId/extractions/:jobId` — stav a kandidáti;
- `PATCH .../:jobId/fields/:candidateId` — `ACCEPTED`, `EDITED` nebo `REJECTED`;
- `POST .../:jobId/accept-safe` — pouze bezpečné dosud nepotvrzené návrhy.

## Pipeline a extraktory

Samostatné fáze jsou klasifikace dokumentu, extrakce textu/layoutu, detekce
supplier profilu, generické kandidáty, line items, normalizace, cross-field
validace, výpočet confidence, review a aplikace potvrzených hodnot.

`LayoutTextBlock` ukládá text, stránku, x/y, šířku, výšku, pořadí a volitelnou
OCR confidence. Layout analyzer skládá řádky, oblasti a tabulkové kandidáty;
raw typy `pdfjs-dist` neopouštějí adapter. `GenericInvoiceExtractor` používá
české i anglické labely a jejich blízkost. Verzovaný supplier profil se
aktivuje pouze při shodě bezpečných markerů. Současný profil pokrývá
anonymizovaný layout odpovídající opakované faktuře Alza; neobsahuje reálné
objednávky ani osobní údaje. `StructuredAiExtractorPort` je pouze vypnutá
budoucí hranice.

Podporovaná pole faktury: dodavatel, IČO, DIČ, číslo faktury, variabilní a
konstantní symbol, objednávka, vystavení, DUZP, splatnost, mezisoučet, DPH,
částka k úhradě, měna, účet, IBAN, `purchaseSummary` a `lineItems`. Položka
obsahuje popis, množství, jednotku, jednotkovou cenu, sazbu DPH a celkem, pokud
jsou skutečně nalezené. Summary vzniká z položek a odstraňuje částky či
platební instrukce.

## Normalizace a confidence

Samostatné normalizátory pokrývají česká ISO data, minor-unit peníze přes
`BigInt`, CZK/EUR, kontrolu českého IČO, DIČ, účet, IBAN checksum, VS a číslo
faktury. Cross-field validace kontroluje pořadí dat a toleranční rovnost
`subtotal + VAT ≈ total`.

Confidence není konstanta. Vychází ze síly labelu, vzdálenosti, supplier
profilu, validace formátu/checksumu, konfliktů, cross-field konzistence a OCR
kvality. Kandidát nese například `EXACT_LABEL_MATCH`,
`SUPPLIER_PROFILE_MATCH`, `VALID_CHECKSUM`, `MULTIPLE_CONFLICTING_VALUES`,
`TOTALS_INCONSISTENT` nebo `OCR_LOW_CONFIDENCE`.

## Datový model

`ExtractionJob` ukládá household, dokument/soubor, stav, extractor a schema
verzi, žadatele, časy a bezpečný error code. `ExtractionResult` vlastní omezený
raw text a structured JSON. `ExtractionFieldCandidate` navíc ukládá
`confidenceReasonsJson` a `sourceRegionJson`; review stavy jsou `PROPOSED`,
`ACCEPTED`, `EDITED`, `REJECTED`.

## Autentizace a oprávnění

Extrakční modul získá přístupný stream pouze přes `DocumentsFacade`, které
ověří household a roli. Start/retry/review vyžadují `MEMBER`; `VIEWER` smí
číst existující výsledek. Modul nezná veřejnou URL, neposílá `storageKey` a
nepřistupuje přímo k filesystemu.

## Validace a chybové stavy

Funguje PDF s dostatečnou textovou vrstvou. Parser má timeout 20 sekund, abort
signal a limit raw textu. PDF bez použitelné vrstvy, JPEG a PNG vyžadují
`ImageOcrPort`; bez provideru končí `OCR_NOT_CONFIGURED`. TXT/DOCX/XLSX nejsou
pro extrakci V2 podporované. Žádná externí OCR ani AI služba není zapnutá a data
neopouštějí lokální server.

## Testy

Unit a integrační testy pokrývají dvě firmy na faktuře, rozlišení invoice/order
a issue/due date, preferenci částky k úhradě, české částky, souřadnice PDF
bloků, line items, summary, konflikty, checksumy, ochranu ručních hodnot,
historii opakovaných běhů, timeout i konečný OCR stav. Anonymizovaný quality
fixture vyžaduje všechna hlavní pole a nulové hallucinated fields.

Lokální evaluator:

```bash
pnpm extraction:evaluate --file /absolutni/cesta/faktura.pdf --type INVOICE
pnpm extraction:evaluate --file /tmp/synthetic.pdf --type INVOICE \
  --expected apps/api/test/fixtures/invoice-extraction-v2.expected.json
```

Standardně vypisuje jen názvy polí, confidence, důvody a agregované metriky.
Normalizované hodnoty vypíše jen explicitní `--debug-values`; raw text
nevypisuje. Soubor se neimportuje do produkční databáze ani repozitáře.

## Známá omezení

- OCR provider není nakonfigurovaný;
- job runner je in-process a po pádu procesu není durable;
- tabulkové heuristiky podporují typické textové tabulky, nikoli každý PDF
  generátor;
- supplier profil není obecný důkaz identity dodavatele a aktivuje se jen při
  dostatečné shodě markerů;
- skutečná problematická uživatelská faktura nebyla commitnuta ani použita jako
  veřejný fixture; quality výsledek platí pro anonymizovaný syntetický layout;
- externí AI extrakce je vypnutá a nemá konfigurovaného poskytovatele ani
  souhlas.

## Budoucí možnosti

Durable worker, lokální nebo explicitně nakonfigurovaný OCR adapter a opt-in
structured AI adapter lze doplnit za existující porty. Bankovní import ani
finanční zaúčtování do tohoto modulu nepatří.
