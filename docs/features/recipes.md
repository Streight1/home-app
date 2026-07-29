# Recepty

## Účel

Recepty jsou household kuchařka pod interním workspace `meals` a jedinou
viditelnou URL `/app`. OWNER, ADMIN a MEMBER mohou recept vytvořit a upravit;
VIEWER pouze čte. Archivace zachová historické vazby jídelníčku.

## Datový model

`Recipe` ukládá název, porce jako přesný Decimal, časy, obtížnost, kategorii,
zdroj, poznámky a oblíbený stav. `RecipeIngredient` a `RecipeStep` mají
atomicky přepočítanou souvislou pozici. `Ingredient` je normalizovaný katalog
konkrétní domácnosti; rozdíly v case a whitespace proto nevytvářejí duplicitní
surovinu.

Množství API vždy serializuje jako decimal string. Frontend používá BigInt
fixed-scale aritmetiku a nikoli JavaScript float jako zdroj pravdy.

## Jednotky a porce

Podporované jednotky jsou `g`, `kg`, `ml`, `l`, lžička, lžíce, hrnek, kus,
balení, plátek, špetka, podle chuti a vlastní. Automatická konverze existuje
jen uvnitř dimenzí `g ↔ kg` a `ml ↔ l`. Kus, balení a kuchyňské jednotky se na
hmotnost ani objem nepřevádějí.

Přepočet porcí používá přesný vztah
`původní množství × nové porce / původní porce`. Hodnota „podle chuti“
zůstává bez množství a změna zobrazených porcí nemění uložený recept.

## UI a dokumenty

Jediný `RecipeDialog` obsluhuje create i edit a skládá základní údaje,
suroviny, pořadí kroků a `RecipeDocumentFields`. Fotografie a zdroje používají
existující Documents public API a explicitní `RecipeDocument`; modul nevytváří
nový upload. Seznam podporuje query, kategorii, tag, oblíbené a serverové
stránkování.

## Známá omezení

- zdrojový odkaz je pouze reference, bez scrapingu nebo importu;
- drag-and-drop není zaveden, pořadí má přístupná tlačítka nahoru/dolů;
- výživové hodnoty, zdravotní doporučení a AI recepty nejsou součástí modulu.
