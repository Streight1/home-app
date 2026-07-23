# Zjištění o výdajích

## Stav

Implementováno jako deterministická a vysvětlitelná oblast „Kam mizí peníze“.

## Účel

Insight upozorňuje na rozpočtový práh, růst kategorií/obchodníků, časté malé
nákupy, nezařazené nebo vyšší výdaje a možnou pravidelnou platbu. Není finanční
rada ani důkaz nehospodárného chování.

## Uživatelské scénáře

- Uživatel aktualizuje analýzu jedné měny a přečte headline, hodnotu, baseline
  a vysvětlení.
- Bezpečný drill-down otevře filtrovaný ledger při stejné URL `/app`.
- MEMBER a vyšší zjištění označí „Rozumím“ nebo je skryje.

## Uživatelské rozhraní

Karty upřednostňují vysvětlení před množstvím grafů. Srovnávací graf používá
textovou alternativu, Aurora tokeny a oddělené měny. Empty stav uvádí minimální
historii; API chyba se za empty stav nevydává.

## API

Autentizované `GET /api/v1/finance/insights`, `POST .../refresh`,
`POST .../:id/acknowledge` a `POST .../:id/dismiss`.

## Datový model

`SpendingInsight` ukládá typ, měnu, období, severity/status, bezpečný text,
validované `evidenceJson`, SHA-256 `evidenceHash` a detection timestamps.
Stejný hash je idempotentní a skrytý insight se stejnou evidencí neobnoví.

## Autentizace a oprávnění

Čtení vyžaduje VIEWER, změna stavu a refresh MEMBER. Každý query je omezený
domácností, obdobím a měnou.

## Validace a chybové stavy

Růst kategorie/obchodníka vyžaduje alespoň dvě dokončená srovnatelná období,
medián stejné části období a současně absolutní i relativní významnost. Časté
malé nákupy vyžadují nejméně pět položek a významný součet. Evidence neobsahuje
raw CSV, čísla účtů, protistrany, bankovní popisy ani tokeny.

## Testy

Testy ověřují minimum historie, comparable-day baseline, normalizovaného
obchodníka, absolutní/relativní práh, seskupení malých nákupů, budget insighty,
idempotentní hash a zachování dismissed stavu. UI testy pokrývají akce,
drill-down model, měny, error/empty a grafické textové alternativy.

## Známá omezení

První verze používá pevné bezpečné měnové prahy pro CZK/EUR. Nejde o AI,
predikci jistého chování ani individuální finanční doporučení.

## Budoucí možnosti

Prahy lze přesunout do household konfigurace a agregace do background jobu,
aniž by se měnila vysvětlitelná evidence nebo privacy hranice.
