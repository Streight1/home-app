# Výpravy

## Účel a hranice

Výpravy jsou household modul pro trekking, turistiku a přípravu vybavení.
Spojují konkrétní date-only cestu, účastníky, snapshotový seznam výbavy,
mobilní režim balení, hmotnostní souhrn a vyhodnocení po návratu. Modul
neobsahuje navigaci po trase, počasí ani bezpečnostní certifikaci.

Hlavní menu má jedinou položku **Výpravy**. Uvnitř stejné browser URL `/app`
jsou části Přehled, Výpravy, Gearlisty a Výbava. Dashboard i globální
`Přidat` používají stejné dialogy jako workspace.

## Životní cyklus výpravy

Výprava je `PLANNING`, `PACKING`, `READY`, `IN_PROGRESS`, `COMPLETED` nebo
`ARCHIVED`. Datum začátku a konce je PostgreSQL `DATE`; hodnoty se
neinterpretují jako UTC půlnoc. Konec nesmí předcházet začátku a jednodenní
výlet má nulový počet nocí.

Výpravu lze založit prázdnou nebo z [gearlistu](pack-lists.md). V druhém
případě se položky zkopírují jako snapshoty. Pozdější změna katalogové
hmotnosti, názvu nebo vlastníka historii tiše nepřepočítá. Akce
`Aktualizovat podle katalogu` nejprve vrací preview rozdílů a vyžaduje
potvrzení.

Účastníkem může být jen aktivní člen stejné domácnosti a alespoň jeden
účastník je organizátor. Sdílenou povinnou položku je před stavem `READY`
nutné přiřadit konkrétnímu nositeli.

## Hmotnost a připravenost

Jediným zdrojem hmotnostních výpočtů je backendová
`ExpeditionWeightService`. Množství používá `Decimal`, jednotková hmotnost
celé gramy a výsledek se deterministicky zaokrouhlí na celé gramy:

- base weight je součet zahrnutých `CARRIED` položek;
- worn weight je součet `WORN`;
- consumable weight je součet `CONSUMABLE`;
- starting pack weight je base plus consumable;
- system weight je součet všech tří skupin.

`EXCLUDED` se nepočítá. `MISSING` zůstává v plánované hmotnosti, ale je
výslovně označená. Souhrn obsahuje i kategorie, účastníky a deset nejtěžších
položek.

`READY` je povolené jen tehdy, když jsou všechny `REQUIRED` položky sbalené,
žádná nechybí a každá sdílená povinná položka má nositele. Kategorie
Přístřešek, Spaní, Voda, Lékárnička a Navigace vytvářejí vysvětlitelné
upozornění podle typu výpravy. Uživatel může nerelevantní upozornění vědomě
potvrdit. Kontrola vždy zobrazuje upozornění, že vychází pouze z vlastního
seznamu a nenahrazuje posouzení podmínek.

## Balení a vyhodnocení

Režim **Balit** používá velké checkboxy a filtry Vše, Nesbaleno, Chybí,
Povinné a Spotřební. Podporuje optimistic změnu s rollbackem po API chybě,
hromadné sbalení kategorie, označení vybraných položek jako chybějících,
kopii textového seznamu a potvrzovaný reset. Editor seznamu dovoluje přidat
položku z katalogu nebo vlastní položku, změnit snapshot, pořadí, zatížení,
kritičnost, množství, umístění a nositele pouze pro danou výpravu.

Po dokončení lze každou položku označit jako použitou, nepoužitou, chybějící
nebo rozbitou. Chybějící a rozbité položky mohou vytvořit úkol jen přes
`TasksFacade` a explicitní `TripTaskLink`. U výpravy z gearlistu vznikne
preview návrhů odebrat nepoužité a přidat chybějící položky. Vybrané změny se
do šablony zapíší až po potvrzení; historická výprava se nemění.

## Dashboard a hledání

Widget **Příští výprava** zobrazuje nejbližší budoucí aktivní výpravu, datum,
stav balení, chybějící povinné položky, base weight a cíl. Rozlišuje loading,
API chybu a pravdivý empty state. Globální `Přidat` nabízí `Nová výprava` a
`Nová položka výbavy`.

Read-only `ExpeditionsSearchProvider` je připravený pro budoucí globální
hledání názvu/značky/modelu výbavy, názvu gearlistu a názvu/lokality výpravy.
Výsledek obsahuje jen household-scoped summary a validovaný interní navigation
target; globální Search modul zatím nevznikl.

## Oprávnění a bezpečnost

- `OWNER` a `ADMIN` spravují kategorie a mohou archivovat výbavu, šablony i
  výpravy.
- `MEMBER` vytváří a upravuje výbavu, šablony, výpravy, balení a vyhodnocení.
- `VIEWER` pouze čte.

Backend vždy ověřuje aktivní membership a household scope. Cizí UUID vrací
stejnou obecnou 404 jako neexistující záznam. Audit obsahuje pouze identifikátor
entity a agregované počty/stavy, nikoliv poznámky, fotografie nebo názvy
položek.

## Známá omezení

- Image-search provider je záměrně volitelný a ve výchozí konfiguraci vypnutý.
- Neexistuje počasí, GPS/GPX, route guidance ani automatické bezpečnostní
  doporučení.
- Výpravy nepředstavují obecný majetkový registr a neuchovávají účetní hodnotu.
- Úkol vytvořený z výpravy má explicitní vazbu, ale jeho dokončení automaticky
  nemění výsledek výpravy.
