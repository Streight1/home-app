# Kategorizace transakcí

## Stav

Implementováno pro deterministická pravidla bez regulárních výrazů a AI.

## Účel

Pravidla opakovatelně přiřazují kategorii ručním nebo importovaným pohybům,
aniž by měnila původní bankovní hodnoty.

## Uživatelské scénáře

- Uživatel vytvoří pravidlo podle obchodníka, účtu protistrany, popisu nebo
  variabilního symbolu.
- Pravidla lze prioritizovat, vypnout a omezit účtem nebo typem transakce.
- CSV preview použije stejnou veřejnou categorization fasádu.
- Vybrané existující výdaje lze kategorizovat hromadně.
- Ruční zařazení známého obchodníka může po samostatném potvrzení vytvořit
  návrh pravidla pro příští podobné platby.

## Uživatelské rozhraní

Sekce Finance / Pravidla zobrazuje prioritu a podmínku a poskytuje přístupný
formulář. Neaktivní či chybový stav je odlišen od prázdného seznamu.

## API

`/api/v1/finance/categorization-rules` poskytuje autentizovaný CRUD a
`/bulk-apply` hromadné přiřazení. CSV import neimportuje repository; volá
`FinanceCategorizationFacade`.

## Datový model

`FinancialCategorizationRule` ukládá originální a normalizovanou porovnávací
hodnotu, prioritu, enabled stav, kategorii a volitelné omezení účtem/typem.
`merchantNormalizedName` je oddělený od původní protistrany transakce.

## Autentizace a oprávnění

Čtení vyžaduje aktivní household členství. Mutace vyžadují MEMBER nebo vyšší
a účty i kategorie se znovu ověřují na backendu.

## Validace a chybové stavy

Povolené operátory jsou `EQUALS`, `CONTAINS` a `STARTS_WITH`. Uživatelské regexy,
CSS ani kód nejsou přijímány. První enabled shoda v pořadí priority vítězí.

## Testy

Čisté testy pokrývají merchant normalizaci, shodu pole, omezení typem a prioritu.
Importní test ověřuje aplikaci pravidla před review.

## Známá omezení

Neexistuje AI klasifikace, fuzzy matching ani podmínky složené z více polí.

## Budoucí možnosti

Auditovaná simulace pravidla nad historickými daty a složené podmínky lze
přidat jako samostatné use cases.
