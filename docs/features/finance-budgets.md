# Finanční rozpočty

## Stav

Implementováno pro měsíční a vlastní období v CZK nebo EUR.

## Účel

Rozpočet sleduje celkový household limit a volitelné limity výdajových
kategorií nad jediným finance ledgerem. Nemění transakce a není účetnictvím.

## Uživatelské scénáře

- MEMBER a vyšší vytvoří koncept nebo aktivní rozpočet, nastaví limit a
  varovný práh kategorie a zkopíruje nastavení do dalšího měsíce.
- Uživatel vidí čerpání, refundace, zbývající částku, dny a orientační forecast.
- VIEWER rozpočty čte bez mutačních akcí.

## Uživatelské rozhraní

Finance / Rozpočty používají adaptivní dialog, progress se skutečným procentem,
textové stavy a graf kategorií proti limitu a forecastu. Mobilní dialog je
full-screen a URL zůstává `/app`. Kategorie bez limitu zůstává součástí
celkového čerpání; nezařazené výdaje mají samostatný souhrn.

## API

Autentizované `/api/v1/finance/budgets` poskytuje list/create/detail/update,
archive, copy, summary a kompaktní dashboard. Money hodnoty jsou decimal string
minor units.

## Datový model

`FinancialBudget` vlastní období, měnu, volitelný celkový limit a stav.
`FinancialBudgetAllocation` má unikátní kategorii, kladný `BigInt` limit a
warning threshold 1–100 %. Jedna domácnost nemůže mít dva aktivní rozpočty
stejné měny a období. Archivace zachovává historii.

## Autentizace a oprávnění

Každý dotaz odvozuje domácnost přes `HouseholdAccessService`. OWNER, ADMIN a
MEMBER čtou i mění, VIEWER pouze čte. Cizí entita vrací obecnou 404.

## Validace a chybové stavy

Měsíční období pokrývá celý kalendářní měsíc. Nová alokace přijme jen aktivní
EXPENSE/BOTH kategorii stejné domácnosti. EXPENSE včetně kreditní karty se
přičítá, REFUND odečítá; transfery, spoření, karetní splátky, příjmy a
soft-delete záznamy nevstupují. Měny se nikdy nesčítají.

Forecast používá pouze celočíselný výpočet `net / uplynulé dny * celé období`,
až od pěti dní a tří transakcí; jinak vrací `NOT_ENOUGH_DATA`. Jde o odhad.

## Testy

Unit testy ověřují ledger semantiku, `BigInt` procenta, prahy, forecast,
household/role boundary, období, kategorii a kopírování. Component, Storybook,
screenshot a axe testy pokrývají empty/error, formulář, 40/85/118 %, forecast,
mobile reflow a light/dark motiv.

## Známá omezení

Forecast nezná budoucí příjem ani závazky. Není kurzový model ani rollover
nevyčerpaného limitu. Uzavřený rozpočet se už neupravuje.

## Budoucí možnosti

Po změření objemu dat lze doplnit materializované agregace, plánované závazky a
jemnější finance permissions bez změny ledger invariantů.
