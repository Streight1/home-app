# Nákupní seznamy

## Sdílené seznamy

Domácnost může mít více `ShoppingList`, ale databázový částečný unikátní index
povolí nejvýše jeden aktivní výchozí seznam. Položka ukládá text, přesné
Decimal množství, jednotku, kategorii obchodu, zdroj a stav odškrtnutí.
Odškrtnutí používá optimistic update s rollbackem při API chybě.

Ruční položky zůstávají oddělené od generovaných. `ShoppingListItemSource`
obsahuje explicitní vazby na jídlo, recept a surovinu receptu; není to
polymorfní `entityType/entityId`.

## Generování z jídelníčku

`generate-preview` nic nezapisuje. Uživatel vybere začátek a konec date-only
období, zda zahrnout volitelné suroviny a zda odečíst potvrzené zásoby.
Preview přepočítá porce přes Decimal, sloučí jen shodné suroviny a kompatibilní
jednotky a zobrazí požadované, evidované a výsledné množství. Uživatel může
řádek vyloučit a teprve explicitní `generate-confirm` vytvoří položky.

Slučování:

- `500 g + 1 kg = 1,5 kg`;
- `500 ml + 1 l = 1,5 l`;
- kus + gram, balení + gram, „podle chuti“ + gram a rozdílné custom jednotky
  zůstávají oddělené.

Opakované generování kontroluje source links, nezduplikuje stejné jídlo,
nepřepíše ruční text nebo poznámku a bez potvrzení znovu neotevře
odškrtnutou položku.

## Mobilní použití

Domácnost může v UI založit další účelový seznam, přepínat aktivní seznam a
přidávat ruční položky centrálním quick-add dialogem. Seznam seskupuje položky
podle kategorie a má velký checkbox. Compact layout nepoužívá širokou tabulku
ani horizontální scroll celé stránky. Plnohodnotný offline sync není zaveden;
síťová chyba je viditelná a optimistic změna se vrátí.
