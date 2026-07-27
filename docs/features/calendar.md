# Kalendář

## Stav

Implementováno jako samostatný household feature modul. Podporuje ruční
události, pracovní směny, explicitní celodenní a vícedenní události, účastníky,
šablony, výběrový režim, transakční hromadné úpravy/smazání, bezpečný feed
termínů úkolů, skutečný day/week time-grid a
dnešní dashboardový widget. Události lze plně editovat, mohou mít strukturovaný cíl a
samostatný průběžně počítaný odhad cesty každého účastníka.

## Účel

Kalendář sdílí skutečné události domácnosti bez míchání jejich životního cyklu
s úkoly. `CalendarEvent` je plánovaná událost; `Task` zůstává úkolem a do
kalendáře vstupuje přes read-only feed, nebo po explicitním potvrzení planningu
přes `TaskCalendarLink` jako skutečný event se zdrojem `TASK`.

## Uživatelské scénáře

- běžná, osobní, household, cestovní nebo vícedenní událost;
- pracovní směna 08:00–20:00, 20:00–08:00, 08:00–14:00 nebo 14:00–20:00,
  přiřazená právě jednomu členu;
- více účastníků u běžné události;
- šablona s cílovým místem a hromadné vložení na zvolené dny; šablona nikdy
  neukládá konkrétní počátek cesty;
- bezpečné vrácení posledního batch pouze před ruční úpravou událostí;
- měkké odstranění jednotlivé ruční, šablonové i task-linked události; při
  task-linked smazání původní úkol zůstane a lze jej znovu naplánovat;
- termín Úkolu v kalendáři a dokončení přes veřejné Tasks API;
- explicitně potvrzený task slot, otevření zdrojového úkolu a bezpečné odebrání
  pouze calendar vazby;
- dnešní a právě probíhající události na dashboardu.
- celodenní událost bez povinného času a volitelný požadovaný čas příjezdu pro
  výpočet cesty;
- hromadně změnit barvu, typ, účastníky, cíl nebo cestovní konfiguraci a
  atomicky soft-delete nejvýše 200 vybraných událostí;
- ověřené i ruční místo události, AUTO/výchozí/vlastní/předchozí počátek,
  bezpečnostní rezervu a automatický náhled odhadu ještě před uložením;
- samostatně zapamatovaný pohled pro telefon, tablet a desktop.

## Uživatelské rozhraní

Kalendář se otevírá jako interní plocha v `/app`; detail i dialogy používají
workspace history state, nikoli veřejné feature URL. Desktop nabízí Měsíc,
Týden, Den a Seznam. Den používá vertikální osu 00:00–24:00, all-day sekci,
hodinové/půlhodinové čáry a current-time indikátor. Týden má společný sticky
time gutter, sedm denních sloupců a horizontální scroll uvnitř calendar
kontejneru. Překrývající se intervaly jsou vedle sebe. Mobil výchozí Den
zachovává osu a týden zůstává horizontálně posuvný time-grid; formulář je
full-screen adaptivní Dialog. Noční nebo vícedenní event zůstává jednou entitou
a má pouze vizuální segmenty navazujících dnů. Šablony jsou v sekundárním
dialogu, takže nepřekážejí hlavnímu kalendáři. Hromadné použití používá
skutečný pondělím začínající měsíční kalendář, lokalizovaný název měsíce a
vícenásobný výběr dnů; nezobrazuje technickou hodnotu `YYYY-MM` jako hlavní
popisek. Jednočlenná událost používá
serverem validovaný `calendarColorToken` účastníka; společná událost používá
`shared` akcent a avatar/iniciály všech členů. Barva vždy doplňuje jméno nebo
avatar a nikdy nenese význam sama.

Události používají centralizovaný `visual` model. Explicitní event color má
přednost před barvou jednoho účastníka, následuje `shared` pro více účastníků a
`neutral` fallback. Celý surface, border, hover, focus a selected stav používá
odpovídající Aurora token. Přímá tlačítka Den/Týden/Měsíc nahrazují časté
otevírání selectu; Seznam zůstává sekundární volbou. Měsíc ve výchozím stavu
ukazuje cestu jen jako kompaktní řádek pod cílovou událostí. Plné časové travel
bloky zůstávají v dni/týdnu a lze je volitelně zapnout i v měsíci.

Akce `Vybrat` přepne klikání eventů do selection režimu. Toolbar umí vybrat vše
v aktuálním zobrazení, výslovně měnit jen označená pole a potvrzeně smazat celý
batch textem `SMAZAT`. Task preview a travel bloky nejsou samostatně
vybíratelné. Po použití šablony lze jedním krokem vybrat právě eventy daného
vložení.

Geometrie day/week pohledu je společná: `time-grid.layout.ts` převádí minuty od
půlnoci na pixely jednou konstantou a poskytuje top, délku, výšku, denní
segmentaci i interval-partitioning. Positioning wrapper a vnitřní event surface
vyplňují stejnou výšku. Směna 08:00–20:00 proto zabere 720 minut, půldenní
směna 360 minut a minimální výška zvětšuje jen velmi krátké události. Jedna
noční směna 20:00–08:00 se pouze promítne jako segment 240 + 480 minut.
Volba pohledu se načítá ze serverové `CalendarUserPreference`; namespacovaná
lokální cache obsahuje jen view enumy a nemění viditelnou URL `/app`. Odhad
cesty se zobrazuje jako read-only blok před událostí, v detailu a dnešním
dashboardu. Jeho začátek je přesně serverové `departureAt`, konec je
`departureAt + durationSeconds` a rezerva zůstává samostatným volným úsekem před
cílovou událostí. Blok má odlišný přerušovaný vzhled, uvádí cíl i cestujícího a
nelze jej editovat jako událost. Formulář používá stejné autocomplete cíle jako nastavení výchozího
místa, nová událost má `calculateTravel=true` a výsledek ukazuje minuty,
vzdálenost, odjezd i skutečně zvolený AUTO zdroj. Konflikt obsahuje ikonu i
vysvětlující text.

## API

Autentizované controllery poskytují CRUD událostí, feed, dashboard, bulk
preview/update/delete, CRUD šablon, single/bulk apply a batch revert. Přesné
cesty jsou v
[katalogu endpointů](../api/endpoints.md). Feed kombinuje
`ManualCalendarEventSource` a `TaskCalendarSource`; nevytváří kopie tasků.
Aktivně naplánovaný task se v read-only feed source vynechá, takže se vedle
linked `TASK` eventu nezobrazí duplicitně.
Cestovní endpointy konfigurují plán konkrétního účastníka, poskytují transientní
`POST /calendar/travel-estimate`, explicitní předchozí event a přepočet. Mapy
HTTP adapter není součástí calendar modulu; kalendář závisí pouze na
location/routing portech.

## Datový model

Časovaná `CalendarEvent` nese UTC instanty `startsAt`/`endsAt`. Celodenní
událost místo nich používá PostgreSQL `DATE` hranice `allDayStartDate` a
`allDayEndDateExclusive`; jednodenní 10. srpna tedy končí exkluzivně 11. srpna.
Volitelné `desiredArrivalAt` určuje výpočet cesty, jinak se pro all-day event
trasa nepočítá. Model dále drží IANA timezone, typ, stav, zdroj
(`MANUAL`, `TEMPLATE` nebo `TASK`), nullable explicitní color token a volitelné
odkazy na template/batch. `deletedAt` a `deletedByUserId` tvoří bezpečný
soft-delete; `CANCELLED` je nadále odlišný historický stav. Běžné query, feed,
availability i konflikty odstraněné události filtrují.
`CalendarEventParticipant` je explicitní vazba na aktivního člena.
`CalendarTemplate` ukládá lokální časy, cílové místo a `endDayOffset`; noční
20:00–08:00 má offset 1 a po aplikaci vzniká jediný event. Neukládá
`originPlaceId`, konkrétní previous event ani travel výsledek.
`CalendarTemplateApplicationBatch` spojuje jednu potvrzenou transakci. Ruční
smazání jedné batch události nemaže šablonu ani sourozence a rollback ji
přeskočí, aniž by ji obnovil.
`CalendarEvent.locationPlaceId` odkazuje na strukturované místo a
`locationLabel` drží uživatelem potvrzený čitelný text. `CalendarEventTravelPlan`
persistuje pouze konfiguraci účastníka a stav, nikoli dobu, vzdálenost,
geometrii nebo odpověď poskytovatele. `departureAt` se na serveru počítá znovu
ze začátku eventu, aktuálního odhadu a rezervy. `CalendarUserPreference` drží
tři nezávislé volby zobrazení, cestovní defaulty, měsíční preferenci plných
travel bloků a posledního účastníka směny.

## Autentizace a oprávnění

`OWNER`, `ADMIN` a `MEMBER` čtou i mutují události a šablony. `VIEWER` pouze
čte. Účastník musí být aktivní člen stejné serverem odvozené domácnosti. Cizí
event/template není rozlišitelný od neexistujícího.
PRIVATE místo jiného člena se nevrací. Travel plan patří aktivnímu účastníkovi;
previous event musí mít stejné household scope a traveler členství.
Člen může změnit vlastní kalendářovou barvu; `OWNER`/`ADMIN` také barvu jiného
člena, aniž by tím měnil jeho bezpečnostní roli.

## Validace a chybové stavy

Konec musí být po začátku, timezone musí být platná IANA hodnota a color token
pochází z pevného Aurora allowlistu. Směna má právě jednoho účastníka. Překryv
směn stejného člena vrací explicitní konflikt, který lze vědomě potvrdit.
Neexistující lokální čas při jarním DST se odmítne. Dvojznačný podzimní čas
deterministicky použije dřívější offset a response to označí
`EARLIER_OFFSET`; tato policy se nemění podle běhového prostředí.
AUTO hledá nejbližší předchozí aktivní událost téhož účastníka, která skončila
nejvýše osm hodin před začátkem a má routovatelný cíl; jinak použije jeho
výchozí místo. U společné události se pravidlo provede pro každého zvlášť.
Změna relevantního vstupu označí konfigurace `STALE` a čas eventu se
automaticky neposouvá. Cyklus, self-link a nevhodný previous event se odmítají.
Selhání Mapy zachová událost a vrátí bezpečný `FAILED`/`UNAVAILABLE` stav.
Bulk mutace má limit 200 a je all-or-nothing: jediný cizí/neplatný event
zneplatní celý request. Nepoužité pole má operaci `UNCHANGED`, takže prázdný
formulář nikdy hodnotu nesmaže. Bulk delete zachová Task i Template, uzavře
aktivní `TaskCalendarLink` a odstraní odvozené travel plány.

## Testy

Backend testuje noční směnu jako jeden záznam, DST policy, více účastníků,
household validaci, konflikty, jediný transakční bulk call, rollback ručně
změněného batch, soft-delete všech zdrojů, zachování `Task`, odpojení
`TaskCalendarLink`, feed source a bezpečný mapper. Frontend testuje Month default,
mobilní list layout, 08:00/08:30 pozice, dva a tři překryvy, noční segmenty,
travel block, sedm dní, current-time indikátor, secondary template dialog,
pondělím začínající month picker, české skloňování výběru, task-linked delete
dialog, Tasks navigation/quick-complete a
VIEWER režim. Storybook, Playwright screenshoty a axe scénáře pokrývají měsíc,
týden a adaptivní event formulář v light/dark režimu.
Location/travel testy navíc pokrývají explicitní i AUTO origin, zákaz cache,
departure/buffer, konflikt, stale propagaci, Mapy timeout a bezpečné mappery;
frontend debounce, zrušení requestu, klávesový combobox, default-place flow,
automatický preview, účastníky, směnové presety, atribuci a view cache.
Regresní testy navíc kontrolují přesnou geometrii 08:00–20:00, obě půldenní
směny, noční segmenty, zachování výšky při overlap layoutu a shodnou plnou
výšku positioning wrapperu, surface a focusovatelného tlačítka.
Nové testy pokrývají color precedence a celý podbarvený surface, all-day DATE
hranice bez půlnoci, desired arrival, kompaktní měsíční cestu, segmented view
controls, selection, `SMAZAT`, 200eventový limit, VIEWER zákaz a atomické
odpojení task-linked batch.

## Známá omezení

- bez drag-and-drop, Google Calendar/CalDAV a pozvánek;
- žádný automatický výpočet odpracované doby ani mzdy;
- podzimní DST ambiguity používá zdokumentovaný dřívější offset bez extra UI
  potvrzení;
- běžné překryvy se neblokují; varování je pouze pro WORK_SHIFT stejného člena;
- změna eventu vytvořeného batchem jej odpojí od automatického rollbacku.
- hromadná editace záměrně nemění název, datum ani čas; tyto hodnoty vyžadují
  individuální editaci;
- soft-delete zatím nemá uživatelský koš ani obnovu; odstraněná událost zůstává
  pouze auditovatelným databázovým záznamem;
- není veřejná doprava, route mapa, live poloha ani turn-by-turn navigace;
- Mapy výsledky se záměrně necachují ani nepersistují; bez development klíče
  nelze provést skutečný provider smoke test;
- neověřený ruční text není routovatelný a proto nemá odhad cesty.

## Budoucí možnosti

Další explicitní feed sources mohou přidat smluvní termíny, servis vozidel nebo
záruky. Google Calendar vyžaduje samostatný consent/token lifecycle a nesmí být
spojený s přihlášením.
