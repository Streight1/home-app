# Finance

## Stav

Implementováno v rozsahu household ledgeru: účty včetně kreditních karet,
dvouúrovňové kategorie, příjmy, výdaje, refundy, převody, dokumentové vazby,
seznam, detail, editace/soft-delete, zůstatky, CSV import, analytika, rozpočty a
vysvětlitelná výdajová zjištění. Modul
není přímá bankovní integrace ani účetnictví.

## Účel

Finance poskytují domácnosti společný a přesný přehled ručně zaznamenaných
peněžních pohybů. Zdroj pravdy tvoří opening balance účtu a nesmazané ledgerové
zápisy; průběžný zůstatek se samostatně nepersistuje.

## Uživatelské scénáře

- OWNER nebo ADMIN vytvoří běžný, spořicí, kreditní, hotovostní či jiný účet v CZK/EUR,
  později jej upraví, archivuje nebo obnoví.
- Správce vytvoří příjmové/výdajové kategorie nebo explicitně založí
  idempotentní doporučenou sadu. Strom má nejvýše dvě úrovně.
- MEMBER a vyšší přidá, upraví nebo po potvrzení soft-delete ruční příjem či
  výdaj a může jej propojit s dostupnými dokumenty.
- Převod mezi dvěma aktivními účty stejné měny vznikne jako atomický pár
  `TRANSFER_OUT`/`TRANSFER_IN`, lze jej upravit či odstranit pouze jako celek a
  nezapočítá se do příjmů ani výdajů.
- VIEWER prohlíží účty, transakce, zůstatky a reporty bez mutačních akcí.
- MEMBER a vyšší importuje CSV přes kontrolované preview a může potvrdit
  kategorizaci nebo bezpečnou splátku kreditní karty jako převod.

## Uživatelské rozhraní

Interní workspace area `finance` při stále stejné browser URL `/app` obsahuje
Přehled, Transakce, Rozpočty, Kam mizí peníze, Opakované platby, Účty,
Kategorie, Importy, Pravidla a Analytika. Filtry, stránka, velikost stránky a řazení
zůstávají v interním workspace stavu; do URL se nezapisují.

Seznam podporuje hledání, účet, kategorii, typ včetně obou směrů převodu,
datumové období, přítomnost dokumentu, bezpečné amount filtry v minor units a
řazení. Přehled nabízí tento měsíc, minulý měsíc a vlastní interval, zůstatky,
oddělené měnové agregace, největší kategorie s přechodem do filtrovaného ledgeru
a počet nezařazených výdajů.

Desktop používá strukturovaný ledgerový seznam, mobil samostatné karty bez
horizontální tabulky. Create/edit formuláře používají adaptivní Dialog, sdílený
český `DatePicker`, přesný money parser a bezpečný dokumentový picker. Smazání
ruční transakce i celého převodu vyžaduje potvrzovací Dialog. Volitelná sada
doporučených kategorií se vytvoří až po explicitním potvrzení. Dashboard skládá
pouze veřejný `FinanceDashboardWidget`, zobrazuje skutečné měsíční výdaje,
porovnání, top kategorii a kompaktní trend a nezobrazuje fixture částky.

## API

Všechny `/api/v1/finance/*` endpointy jsou autentizované a mutace podléhají
Origin/CSRF ochraně. Samostatné controllery obsluhují účty, kategorie,
transakce, převody a reporting. Úplný seznam je v
[katalogu endpointů](../api/endpoints.md).

Money DTO používá decimal string minor units, například
`{"amountMinor":"3899000","currencyCode":"CZK"}`. Server neposílá JavaScript
`BigInt`, Prisma entity ani interní dokumentová metadata.

## Datový model

- `FinancialAccount` — účet, měna, opening balance/date a archivace;
- `FinancialCategory` — household strom do dvou úrovní a kind
  `EXPENSE`/`INCOME`/`BOTH`;
- `FinancialTransaction` — kladná `BigInt` částka, typ určující znaménko,
  date-only datum, source a soft-delete;
- `FinancialTransfer` — propojení obou ledgerových stran jedné atomické
  operace;
- `FinancialTransactionDocument` — explicitní M:N vazba se skutečným FK na
  dokument.
- `FinanceImportSession`, `FinanceImportRow` a `FinanceImportProfile` —
  dočasný import, normalizované preview řádky a opakovaně použitelné mapování;
- `FinancialCategorizationRule` — household pravidlo s prioritou, polem,
  operátorem a volitelným omezením na účet a typ.
- `FinancialBudget` a `FinancialBudgetAllocation` — měnově oddělené celkové a
  kategoriální limity;
- `SpendingInsight` — idempotentní vysvětlitelné zjištění bez raw bankovních
  dat;
- `RecurringExpenseCandidate` a `RecurringExpense` — detekovaný vzor a ručně
  potvrzená analytická evidence.

Zůstatek je opening balance plus příjmy/refundy/transfer-in/adjustment minus
výdaje/transfer-out. U kreditní karty záporný ledger znamená dluh; splátka je
interní převod, ne druhý výdaj. Reporty jsou vždy omezené domácností a obdobím a měny se
agregují odděleně bez automatického kurzu. Výchozí kalendářní měsíc vzniká z
injektovaného `FinanceClockPort`, takže testy nezávisí na systémovém čase.

## Autentizace a oprávnění

Globální access guard chrání každý endpoint. `HouseholdAccessService` odvozuje
aktivní household a vynucuje role. VIEWER čte. MEMBER vytváří/upravuje/maže
ruční transakce, spravuje dokumentové vazby a převody. ADMIN/OWNER navíc
spravují účty a kategorie. Cizí nebo chybějící household entita vrací stejnou
obecnou 404.

Finance ověřují document IDs pouze přes veřejný `DocumentsFacade`; neimportují
document repository, storage ani raw metadata.

## Validace a chybové stavy

- částka je kladné celé číslo minor units; UI přijme český formát `1 249,50`
  bez `parseFloat`;
- měna je v první verzi CZK nebo EUR a musí odpovídat účtu;
- převod vyžaduje dva různé aktivní účty stejné měny;
- EXPENSE nepřijme čistě INCOME kategorii a naopak;
- archivovaný účet nebo kategorie nejdou použít pro nový zápis;
- měnu účtu s transakcemi nelze změnit;
- transferovou polovinu nelze samostatně upravit ani smazat;
- chyby loading/empty/API zůstávají v UI rozlišené a české.

## Testy

Backendové testy pokrývají přesné minor units, ledger znaménka, kategorie,
role, transferové invarianty, household/repository hranice a deny-by-default
HTTP policy. Frontendové testy pokrývají money helpery, formulář, date picker,
dokumentový picker, filtrování, velikosti stránek a empty/error stavy.
Storybook, Playwright screenshoty a axe scénáře pokrývají finance na compact,
medium a expanded šířce v light/dark motivu.

## Známá omezení

Neexistuje bankovní API, AI kategorizace ani bankovní pravidelné příkazy,
směna měn, fakturové párování, investice, výpočet úroků ani
daňová evidence. Převod podporuje pouze stejnou měnu. Soft-delete ruční
transakce v této verzi nemá uživatelské obnovení. Finance jsou viditelné všem
členům household podle společných rolí; jemnější privacy permission model není
implementovaný.

## Budoucí možnosti

Samostatné iterace mohou doplnit bankovní provider port,
AI-assisted návrhy nebo explicitní invoice-payment vazby. Tyto
oblasti nesmějí obcházet ledger invarianty ani spojovat různé měny bez
explicitního kurzu a auditované konverze.
