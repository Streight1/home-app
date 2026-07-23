# Product UI brief

## Produktový charakter

HomeApp Aurora je klidné pracovní prostředí s hlubokými indigovými plochami,
fialovým akcentem a čistou typografií. Technologický charakter má zpřehlednit
citlivou domácí agendu, nikoli z ní vytvořit neonový marketingový dashboard.
Light motiv zachovává stejnou hierarchii na chladných neutrálních surfaces.

## Cíle

- rychle ukázat, co vyžaduje pozornost;
- fungovat stejně s prázdným i budoucím hustým obsahem;
- respektovat systémový, světlý a tmavý motiv bez flashnutí;
- udržet navigaci srozumitelnou na telefonu, tabletu i desktopu;
- rozlišit aktivní a připravované oblasti bez předstírání funkcionality;
- podporovat WCAG 2.2 AA, klávesnici, reduced motion a 200% reflow.

## Vizuální principy

- klidná modročerná nebo chladně světlá plátna a jasně oddělené surfaces;
- fialový primární akcent, modrá a cyan pouze jako podpůrné barvy;
- Inter s kompaktní pracovní hierarchií;
- panely definované borderem, stín pouze podle elevation role;
- aurora gradient jen na loginu, CTA, značce a jednom dashboard headeru;
- Lucide jako jediná ikonová knihovna;
- ikona má význam a viditelný text nebo přístupný název.

## Dashboard

Dashboard je attention-first, nikoli galerie KPI. Pořadí je:

1. header a přivítání;
2. Vyžaduje pozornost;
3. Rychlé akce;
4. Dnešní úkoly;
5. další oblasti jen s reálnými daty.

Produkce používá prázdná data. Ukázkové částky, dokumenty a termíny existují
pouze ve Storybook fixture a produkční kód je neimportuje.

## Hranice

Není implementováno business hledání, rychlé vytváření, filtrování, nastavení
profilu ani nové datové moduly. UI těchto směrů je označené „Připravujeme“ nebo
disabled. Není vytvořen druhý theme provider, produkční design-preview route ani
kopie Reflect.
