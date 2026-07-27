# Místa a plánování cesty

## Stav

Implementováno jako samostatný backendový `LocationModule` a malé frontendové
location feature. Mapy.com Suggest a Routing jsou volitelné: bez serverového
klíče zůstává kalendář i ruční textová místa použitelná, pouze odhad trasy je
označený jako nedostupný.

## Účel

Feature převádí volný text místa na bezpečný strukturovaný cíl a pro konkrétního
účastníka umí připravit orientační dobu cesty, vzdálenost a doporučený odjezd.
`startsAt` a `endsAt` časované události nikdy nemění. U celodenní události
počítá cestu pouze z uživatelem zadaného `desiredArrivalAt`; bez něj event
zůstane uložitelný a routing se nespustí. Text v UI vždy používá výraz „Odhad
cesty“, protože nejde o garantovaný příjezd.

## Uživatelské scénáře

- vyhledat adresu, obec, firmu nebo POI přes našeptávač;
- uložit soukromé nebo household místo, případně použít neověřený ruční text;
- vyhledat a explicitně uložit vlastní výchozí místo i bez dříve uloženého
  seznamu;
- začít z výchozího místa, z explicitně vybraného vlastního místa nebo z cíle
  explicitně potvrzené předchozí události nebo režimem AUTO;
- vypočítat samostatný odhad pro každého účastníka společné události;
- zobrazit odhad, rezervu, doporučený odjezd a nedostatek času;
- obnovit poslední Month/Week/Day/List pohled zvlášť pro compact, medium a
  expanded layout.
- poskytnout Scheduling modulu bezpečný odhad mezi potvrzenými místy přes
  `TravelEstimationFacade`, bez raw provider dat nebo klíče.

## Uživatelské rozhraní

`PlaceAutocomplete` a `DefaultPlaceAutocomplete` jsou přístupné comboboxy s
minimálně třemi znaky, debounce 350 ms, zrušením starého requestu a ovládáním
Arrow Up/Down, Enter a Escape. První návrh se nevybere bez potvrzení. UI
odlišuje počáteční stav, loading, žádné výsledky, vypnutého providera, chybu
oprávnění, timeout a obecnou nedostupnost. Volný text lze uložit jako `MANUAL`,
ale není prezentován jako routovatelný. `MapyAttribution` je u návrhů a hotového odhadu. Formulář události
skládá místo, poznámky a konfiguraci cesty; editace používá desktop Dialog a
mobilní full-screen variantu. Read-only `CalendarTravelBlock` se odlišuje
přerušovaným borderem a ikonou a otevře cílovou událost, nemá vlastní editaci.
Volba `Jiné místo` používá stejný `PlaceAutocomplete`; pouhý volný text zůstává
neroutovatelný. V měsíci je cesta výchozím způsobem jen kompaktní informace pod
událostí, zatímco den/týden zachovává plný časově umístěný blok.

## API

Všechny endpointy jsou deny-by-default autentizované. Location API poskytuje
suggest, uložená místa a preference. Calendar API poskytuje cestovní
konfiguraci, transientní preview, explicitní kandidáty předchozí události a
přepočet. Prohlížeč volá
jen HomeApp API; Mapy klient existuje výhradně na backendu. Přesný katalog je v
[API endpointech](../api/endpoints.md).
Scheduling smí deduplikovat shodný odhad pouze v paměti jednoho suggest
requestu; persistentní route cache se nepoužívá.

## Datový model

`SavedPlace` používá UUID, uživatelem potvrzený label/adresní text, viditelnost
`PRIVATE` / `HOUSEHOLD` a provider `MAPY` / `MANUAL`. Neukládá raw odpověď,
provider ID ani souřadnice; routování potvrzeného místa jej znovu vyřeší přes
`GeocodingProviderPort`. `CalendarUserPreference` je unikátní pro household a
user a drží default place, route/buffer/avoid volby, travel block, posledního
účastníka směny, tři layoutové view preference a samostatné zobrazení plných
travel bloků v měsíci. `CalendarEventTravelPlan` je
unikátní pro event a traveler a drží pouze origin, route/buffer konfiguraci a
stav. Route response, duration, distance, geometrie a provider timestamp
nejsou persistované.
`CalendarEvent` má snapshot `locationLabel`, volitelné `locationNotes` a FK
`locationPlaceId`; raw provider payload se neukládá.

## Autentizace a oprávnění

Session a household scope kontroluje backend. PRIVATE místo vidí pouze jeho
vlastník, household místo člen dané domácnosti. Cestovní plán lze vytvořit jen
pro aktivního účastníka události a s místy viditelnými aktuálnímu uživateli.
Předchozí event musí být ze stejné domácnosti, patřit travelerovi, skončit před
cílovým eventem, mít strukturované místo a nesmí vytvořit cyklus. Audit ukládá
jen identifikátory, route mode, názvy změn a obecný výsledek — ne adresy,
souřadnice, dotazy, tokeny ani provider klíč.

## Validace a chybové stavy

Mapy integrace vyžaduje klíč pouze při `MAPY_API_ENABLED=true`. Krátké dotazy
se odmítnou před providerem, odpověď se mapuje na allowlist bezpečných polí a
timeout/upstream chyba na obecný kód. Ruční místo může být bez souřadnic, ale
nelze pro něj routovat. Selhání routingu ponechá již uloženou událost a plán
nastaví `FAILED` nebo `UNAVAILABLE`; uživatel může přepočet zopakovat.

Výpočet je `departureAt = startsAt - durationSeconds - bufferMinutes`.
U `PREVIOUS_EVENT` se porovná dostupný interval s dobou trasy a rezervou;
konflikt je varování s časovým rozdílem, ne automatické přeplánování.
Kalendářní travel block začíná právě v `departureAt` a končí po
`durationSeconds`; buffer se zobrazuje jako mezera mezi příjezdem a začátkem
události. Neověřitelný routing při plánování úkolu neodstraní časově validní
kandidát, ale označí jej jako `TRAVEL_NOT_VERIFIED` a vyžádá vědomé potvrzení.

## Testy

Backend mockuje Mapy porty a pokrývá bezpečné mapování, timeout, min query,
zákaz cache, soukromí, čtyři origin režimy včetně AUTO, household izolaci, self-link, časovou
validaci, cyklus, odjezd, buffer, neměnnost eventu, provider failure, konflikt
a stale propagaci. Frontend testuje debounce/cancellation, combobox, explicitní
výběr, ruční fallback, bezpečnou chybu, atribuci, route summary, konflikt a
oddělenou namespacovanou view cache bez lokačních dat.

## Známá omezení

- není veřejná doprava, turn-by-turn navigace, mapa ani live poloha;
- Mapy smoke proti skutečné službě vyžaduje vlastní development klíč;
- jednotlivé Suggest, Geocoding ani Routing výsledky se necachují a
  nepersistují; uchovává se jen uživatelem potvrzený adresní text;
- route geometry se neukládá a dopravní odhad se znovu získá při preview,
  načtení nakonfigurovaného plánu nebo změně relevantního vstupu;
- ruční neověřené místo nemá routing.

## Budoucí možnosti

Provider porty dovolují nahradit geocoder/router bez změny kalendářové logiky.
Druhý mapový provider ale vyžaduje samostatné ADR. Veřejná doprava, route
geometry a navigace jsou samostatné iterace; provider výsledky se nesmějí
zavést jako cache bez nového ověření podmínek a schváleného návrhu.
