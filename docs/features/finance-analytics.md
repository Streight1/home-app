# Analytika výdajů

## Stav

Implementováno pro oddělené CZK/EUR pohledy nad household ledgerem.

## Účel

Analytika ukazuje výdaje podle kategorií, trend, obchodníky a srovnání stejně
dlouhého předchozího období bez zkreslení převody a karetními splátkami.

## Uživatelské scénáře

- Uživatel zobrazí výdaje aktuálního měsíce a nezařazené položky.
- Kliknutí na kategorii nebo obchodníka otevře interní seznam transakcí se
  zachovaným filtrem při stále stejné URL `/app`.
- Refund snižuje výdaj kategorie; kreditní nákup zůstává běžný výdaj.

## Uživatelské rozhraní

Finance / Analytika používá horizontální bary, trend příjmů, výdajů a čistého
rozdílu a samostatné porovnání kategorií s předchozím obdobím. Grafy mají
textové hodnoty, keyboard drill-down včetně období trendu, light/dark tokeny,
mobilní reflow a pravdivý empty/error stav bez demo dat.

## API

Autentizované endpointy `summary`, `category-breakdown`, `monthly-trend`,
`top-merchants`, `category-comparison` a `dashboard` jsou pod
`/api/v1/finance/analytics`. Filtry podporují období, účty, kategorie, měnu a
zahrnutí kreditních karet.

## Datový model

Analytika nevytváří duplicitní agregované tabulky. Čte soft-delete filtrovaný
ledger a vrací string minor units. Různé měny jsou vždy samostatné response
skupiny.

## Autentizace a oprávnění

Každý dotaz vyžaduje session a aktivní household členství. Scope je vždy
`householdId`; účet z cizí domácnosti nemůže rozšířit výsledek.

## Validace a chybové stavy

Výchozí je aktuální měsíc. `dateFrom <= dateTo`, měna je CZK nebo EUR a UUID
filtry jsou validované. `TRANSFER_IN`, `TRANSFER_OUT` a splátky kreditní karty
nejsou výdaj; `REFUND` výdaj snižuje.

## Testy

Testy ověřují refund, vyloučení transferů, kreditní účet, oddělené měny,
nezařazené výdaje, deterministický trend a přístupné chart/drill-down prvky.

## Známá omezení

Bez kurzového modelu nelze měny slučovat. Procentní změna při nulovém minulém
období je záměrně `null`. Investice a rozpočty nejsou součástí analytiky.

## Budoucí možnosti

Export agregací a materializované pohledy lze doplnit po změření reálného
objemu dat. Rozpočty a insighty používají analytiku pouze přes veřejnou
`FinanceAnalyticsFacade`.
