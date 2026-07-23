# Plánování úkolů do kalendáře

## Stav

Implementováno pro neopakované úkoly s délkou a alespoň jedním účastníkem.
Plánovač pouze navrhuje; bez explicitního potvrzení nevytvoří ani nepřesune
žádnou událost.

## Účel

Scheduling modul hledá společný volný čas účastníků a podle dostupných míst
ověří cestu před úkolem i k následující události. Tasks, Calendar a Location
zůstávají samostatnými doménami za veřejnými facades.

## Uživatelské scénáře

- zvolit den, okno 06:00–22:00, route mode, rezervu, zohlednění cesty a počet
  návrhů;
- získat 15minutové kandidáty v průniku dostupnosti všech účastníků;
- vidět vlastní cestu a odjezd každého účastníka i textové varování;
- vybrat návrh a teprve poté potvrdit vložení do kalendáře;
- otevřít zdrojový úkol z eventu, dokončit jej přes Tasks API;
- přeplánovat explicitním odebráním staré vazby a volbou nového návrhu;
- odebrat propojenou událost bez odstranění úkolu;
- při nulovém výsledku vidět počty volných intervalů, kandidátů a bezpečně
  agregované důvody vyřazení; hledání lze zopakovat zítra, v širším okně nebo
  bez ověření cesty.

## Uživatelské rozhraní

`features/scheduling` skládá velký desktopový Dialog a mobilní full-screen
variantu. Vlevo jsou parametry, vpravo nejvýše pět návrhů. Radio group nemá
výchozí výběr. Starší suggest request se ruší přes `AbortController` a sticky
potvrzení je aktivní až po výběru. Workspace navigace po potvrzení otevře event
při stále viditelné URL `/app`. Cesta se ve výchozím stavu zohledňuje. Časově
proveditelný návrh bez ověřitelné cesty zůstane dostupný jako
`TRAVEL_NOT_VERIFIED`, ale uživatel jej musí před výběrem výslovně potvrdit.

## API

- `POST /api/v1/tasks/:taskId/scheduling/suggestions` vrací pouze návrhy;
- `POST /api/v1/tasks/:taskId/scheduling/confirm` revaliduje podepsaný návrh;
- `DELETE /api/v1/tasks/:taskId/scheduling` zruší linked event a vazbu.

Endpointy jsou autentizované a mutace chráněné CSRF. Kandidátní token je HMAC
podepsaný, platí 15 minut a nese hash verze úkolu/kalendáře, původní časové
okno, timezone, zvolený route mode, cestovní rezervu a volbu zohlednění cesty.
Potvrzení tak vytvoří
travel plan se stejnými parametry, se kterými byl návrh vyhodnocen. Token
neobsahuje adresy, provider odpověď ani API klíč.

## Datový model

`TaskCalendarLink` má skutečné FK na `Task` a `CalendarEvent`, household scope,
volitelné `occurrenceDueAt` a `removedAt`. PostgreSQL partial unique index
zaručuje nejvýše jednu aktivní vazbu na úkol. Linked event má `source=TASK`.
Odebrání měkce smaže event a označí vazbu jako odstraněnou v jedné transakci;
úkol zůstává.

## Autentizace a oprávnění

Plánování a odebrání vyžaduje nejméně roli `MEMBER`. TasksFacade ověří úkol,
CalendarAvailabilityFacade všechny účastníky a TravelEstimationFacade viditelnost
potvrzených míst. Scheduling neimportuje cizí Prisma repository ani provider
adapter.

## Validace a chybové stavy

Algoritmus nejprve sloučí busy intervaly všech účastníků, vypočte všechny volné
intervaly a kandidáty pro dražší travel kontrolu vybírá vyváženě napříč nimi.
Ranní interval proto nemůže spotřebovat celý limit a skrýt večerní volno.
Stejná trasa se deduplikuje jen po dobu requestu; persistentní Mapy cache
neexistuje. Bez routovatelného cíle, známého počátku nebo dostupného routingu
vznikne časový návrh s varováním. Timeout vrací `TRAVEL_NOT_VERIFIED`, nikoli
falešně ověřený slot. Dnešní již uplynulá část okna se ořízne na následující
15minutovou hranici; nezahodí se celý den. Před potvrzením server znovu načte původní okno; změna vrací
`SCHEDULING_SLOT_CHANGED` a otevřený dialog si automaticky načte nové návrhy.
DB unikátnost brání dvojitému potvrzení.

Response `diagnostics` obsahuje pouze bezpečné agregace: počet volných
intervalů, vygenerovaných a travelově vyhodnocených kandidátů, počet
proveditelných návrhů, nejdelší volný interval a počty důvodů odmítnutí. Nevrací
soukromé adresy, provider response ani detail cizí události.

## Testy

Čisté testy pokrývají slučování intervalů, přesný fit, noční blokaci a
15minutové hranice. Aplikační testy pokrývají vlastní předchozí i výchozí místa,
cestu před/po úkolu, společnou proveditelnost, chybějící počátek, úkol bez místa,
omezený routing, timeout, pořadí ověřených kandidátů, podepsané route parametry,
revalidaci nového překryvu, souběžné potvrzení a regresní směnu 08:00–20:00 s
volnými okny 06:00–08:00 a 20:00–22:00. Frontend testuje participant
travel, warningy, explicitní výběr, nové návrhy po změně data, abort staršího
requestu, diagnostické recovery akce, povinné potvrzení neověřené cesty,
obnovení po změně slotu, zachování `/app` a bezpečné odebrání.

## Známá omezení

- recurring úkoly nejsou v první verzi plánovatelné;
- bez Mapy klíče jsou routovatelné kandidáty označené jako neověřené;
- plánovač nepřesouvá existující eventy, směny ani dueAt úkolu;
- návrhy nejsou dočasně kreslené v time-gridu;
- po odebrání zůstává soft-deleted linked event jako auditovatelná historie.

## Budoucí možnosti

Další iterace může bezpečně navázat konkrétní recurring occurrence a přidat
uživatelské preference pracovních hodin. Automatické přesouvání existujících
událostí není zamýšlený implicitní krok.
