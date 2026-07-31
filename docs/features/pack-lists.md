# Gearlisty a seznamy balení

## Opakovaně použitelná šablona

`PackTemplate` je household gearlist pro typ výpravy, sezónu, cílovou base
weight a výchozí počet účastníků. `PackTemplateItem` může odkazovat na
[katalogovou výbavu](gear.md), nebo nést vlastní název. V obou případech
ukládá snapshot názvu, kategorie, jednotkové hmotnosti, Decimal množství,
zatížení, kritičnosti, sdílenosti, výchozího nositele a umístění v batohu.

Položky mají atomické, unikátní pořadí. Šablonu lze vytvořit, upravit,
duplikovat, archivovat a po read-only preview vědomě aktualizovat podle
katalogu.

## Konkrétní seznam

Při založení [výpravy](expeditions.md) se šablona zkopíruje do
`TripPackItem`. Konkrétní výprava pak může:

- přidat katalogovou nebo vlastní položku;
- změnit snapshot názvu, kategorie, množství a hmotnosti;
- změnit `CARRIED`, `WORN` nebo `CONSUMABLE`;
- změnit kritičnost a sdílenost;
- přiřadit nositele z účastníků;
- změnit pořadí a umístění;
- položku sbalit, označit jako chybějící nebo vyloučit.

Tyto změny se nepropíší zpět do šablony. Po návratu vznikne oddělený,
potvrzovaný preview návrh pro odstranění `UNUSED` položek a přidání
`MISSING_DURING_TRIP`. Tím zůstává šablona opakovatelná a historie neměnná.

## Mobilní UX a chyba sítě

Packing mode používá karty bez horizontální tabulky, minimální 44px ovládání,
textové statusy a přehled počtu i hmotnosti. Jednotlivé změny stavu jsou
optimistické; při API chybě se cache vrátí k předchozímu snapshotu a chyba
není vydaná za úspěch. Reset celého balení a změna šablony vyžadují potvrzení.

## Známá omezení

Pořadí používá přístupná tlačítka nahoru/dolů místo drag-and-drop. Checklist
vychází pouze z uživatelsky sestaveného gearlistu a neposuzuje trasu, počasí
ani bezpečnost.
