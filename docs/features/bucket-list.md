# Sdílený roční Bucket list

## Stav

Implementováno jako samostatný household feature modul. Jedna domácnost může
mít nejvýše jeden seznam pro daný rok.

## Účel

Bucket list zachycuje společná přání, zážitky a cíle pro konkrétní kalendářní
rok. Není to seznam povinností ani náhrada Úkolů: položka nemá recurrence,
upomínky nebo automatické plánování do kalendáře.

## Uživatelské scénáře

- Člen založí seznam pro vybraný rok a přidá přání s kategorií a prioritou.
- K přání vybere více aktivních členů domácnosti, cílové datum bez času,
  potvrzené nebo textové místo, poznámky a související dokumenty.
- Přání dokončí s datem a volitelnou poznámkou, znovu otevře, přeskočí nebo
  obnoví.
- Na konci roku hromadně přenese vybrané plánované nebo přeskočené položky do
  dalšího roku. Dokončené položky zůstávají historií původního roku.
- Dashboard ukazuje skutečný postup a nejbližší položky bez ukázkových dat.

## Uživatelské rozhraní

Feature je dostupná v interní workspace navigaci jako `Bucket list`; viditelná
URL zůstává `/app`. Přehled nabízí přepnutí roku, hledání, filtr stavu,
kategorie a účastníka, řazení, progress a pravdivý empty state. Compact režim
používá jeden sloupec a adaptivní full-screen dialogy, medium/expanded
vícesloupcové karty a desktop dialogy. Detail zobrazuje účastníky, místo,
dokumenty, dokončovací historii a povolené lifecycle akce.

## API

Autentizované `/api/v1/bucket-lists` poskytuje roční list/create/detail/update,
close/archive, nested item list/create, dashboard, summary a rollover
prepare/carry. `/api/v1/bucket-list-items/:itemId` poskytuje
detail/update/delete, complete/reopen/skip/restore a atomické nahrazení
účastníků nebo dokumentů. Žádný endpoint není veřejný.

## Datový model

`YearlyBucketList` vlastní rok, titulek, stav a household. `BucketListItem`
vlastní obsah, kategorii, prioritu, stav, date-only cílové datum, volitelné
místo a rollover vazbu na nově vytvořenou položku. Explicitní
`BucketListItemParticipant` a `BucketListItemDocument` mají skutečné cizí
klíče; nevzniká polymorfní `entityType/entityId`. `BucketListItemCompletion`
uchovává historii dokončení.

Rollover vždy vytvoří nové UUID a pouze dohledatelnou self-relation. Nekopíruje
dokončovací historii a nikdy nepřesouvá nebo nemaže původní položku.

## Autentizace a oprávnění

Každý use case odvozuje domácnost přes `HouseholdAccessService`. `VIEWER` smí
seznamy, položky a dashboard číst. `MEMBER`, `ADMIN` a `OWNER` mohou seznamy a
položky měnit, dokončovat, přeskakovat, mazat a provést rollover. Účastníci,
místo i dokumenty musí být dostupné ve stejné domácnosti; cizí nebo neexistující
entita vrací stejnou obecnou 404.

## Validace a chybové stavy

Rok je omezený na 2000–2100, title na 200 znaků, description na 2 000 a notes
na 10 000 znaků. Cílové datum je ISO `YYYY-MM-DD` bez skrytého času.
Dokončení vyžaduje datum, přeskočení bezpečně ukládá jen krátký důvod. Duplicitní
household/year končí bezpečným konfliktem. Rollover přijme jen položky původního
seznamu ve stavu `PLANNED` nebo `SKIPPED`; souběžná chyba transakci vrátí celou.

## Testy

Backend unit testy pokrývají household/role boundary, duplicitní rok,
participant/document/location validaci, atomické dokončení, progress,
dashboardový rok a bezpečný audit. HTTP access-policy sada ověřuje anonymní 401. Frontend testy pokrývají progress, empty stav, viewer UI, interní filtry,
date-only formulář, bezpečnou workspace navigaci a quick complete.
Storybook, screenshot a axe scénáře ověřují prázdný i naplněný seznam,
dashboard, compact/expanded layout a oba motivy.

## Známá omezení

Položky nelze opakovat ani automaticky vložit do kalendáře. Místo používá
existující uložené aplikační místo; Bucket list nevolá Mapy.com přímo. Rollover
je explicitní a nepřenáší dokončené položky ani completion history.

## Budoucí možnosti

Samostatná iterace může přidat připomínky, calendar link vlastněný příslušným
modulem, jemnější oprávnění nebo galerie skutečných dokončených přání. Tyto
možnosti nesmějí proměnit Bucket list v paralelní Tasks modul.
