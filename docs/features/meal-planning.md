# Jídelníček

## Týdenní plán

`MealPlanEntry` je date-only položka od pondělí do neděle. Obsahuje typ jídla,
snapshot názvu, přesný počet porcí, volitelný recept a poznámku.
`MealPlanParticipant` propojuje aktivní členy stejné domácnosti; počet porcí
nemusí odpovídat počtu účastníků.

Date-only hodnota neprochází implicitním UTC konstruktorem a zachová den i přes
DST v `Europe/Prague`. Archivovaný recept zůstává v historickém plánu čitelný.

## Ovládání

Desktop používá sedmisloupcový grid, compact layout dny pod sebou bez overflow.
Jídlo lze vytvořit, upravit a odstranit přes centrální `MealPlanDialog`.
Předchozí, aktuální a další týden mají explicitní ovládání. Kopie týdne se
provede až po potvrzení; výchozí režim pouze doplní volná místa a nepřepisuje
existující položky.

Globální `Přidat → Naplánovat jídlo`, dashboard a planner používají tentýž
dialog a invalidaci meals query. Viditelná URL zůstává `/app`.

## Kalendář

`MealsFacade.getCalendarSummary` vrací omezený date-only souhrn. Calendar
workspace jej skládá jako kompaktní sekci Jídelníček; nevytváří z každého
jídla `CalendarEvent` a neimportuje Meals repository.

## Známá omezení

- přesun položky se provádí editací data, nikoli drag-and-drop;
- kopie týdne standardně nepřepisuje obsazené sloty;
- kalendářní souhrn zatím používá společné zobrazení bez samostatné
  persistované preference viditelnosti.
