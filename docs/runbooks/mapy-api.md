# Mapy.com REST API

Tento runbook popisuje volitelnou backendovou integraci pro Suggest a Routing.
Skutečný klíč se nikdy nezapisuje do repozitáře, dokumentace, Storybook fixture
ani Vite konfigurace.

## Zřízení projektu a klíčů

1. V účtu Mapy.com Developer vytvoř API projekt a povol jen služby používané
   aplikací: REST Suggest/Geocoding a Routing.
2. Vytvoř oddělený klíč pro development a production.
3. Produkční klíč omez na veřejnou IP backendu a pouze potřebné služby.
4. Klíč vlož jen do kořenového `.env` jako `MAPY_API_KEY`; nikdy nevytvářej
   `VITE_MAPY_API_KEY`.
5. Nastav `MAPY_API_ENABLED=true` a restartuj API. Při vypnuté integraci může
   být ukázkový klíč prázdný.

Používané proměnné: `MAPY_API_ENABLED`, `MAPY_API_KEY`,
`MAPY_API_TIMEOUT_MS`, `MAPY_SUGGEST_MIN_QUERY_LENGTH`,
`MAPY_SUGGEST_MAX_RESULTS` a `MAPY_DEFAULT_LANGUAGE`. Cache TTL proměnné byly
odstraněné, protože aplikace jednotlivé provider výsledky necachuje.

## Bezpečnost

Mapy requesty provádí jen NestJS adapter a klíč posílá v hlavičce
`X-Mapy-Api-Key`. Aplikace neloguje klíč, celou URL, autocomplete dotaz,
souřadnice ani response payload. Frontend obdrží pouze bezpečný souhrn místa a
výsledek odhadu. Po rotaci změň hodnotu v secret storage deploymentu a
restartuj API; starý klíč zneplatni až po ověření nového.

## Ukládání a cache

Aktuální [podmínky Mapy.com](https://developer.mapy.com/terms-and-conditions/)
zakazují ukládat a cachovat jednotlivé výsledky API funkcí. HomeApp proto
neukládá raw Suggest/Geocoding response, provider ID, souřadnice, route response
ani geometrii a nemá procesovou route/suggest cache. Uložit lze pouze vlastní
uživatelský údaj potřebný pro aplikaci: potvrzený popisek, zobrazený adresní
text a volbu výchozího místa. Před routingem se tento text znovu vyřeší přes
provider port. Toto pravidlo při každé změně integrace znovu porovnej s aktuální
dokumentací; není to obecné právní stanovisko.

## Attribution

`MapyAttribution` používá oficiální logo a copyright odkaz u našeptávání a
route summary. Atribuci neodstraňuj ani vizuálně neskrývej. Při budoucím mapovém
náhledu znovu ověř aktuální pravidla poskytovatele.

## Testovací postup

1. Spusť `pnpm env:check` a backendové unit testy; ty používají mockované porty
   a nekontaktují externí službu.
2. S vlastním development klíčem hledej pouze veřejný syntetický cíl, například
   obec nebo veřejnou instituci — ne soukromou adresu.
3. Ověř adresu i POI, atribuci, route mode, doporučený odjezd a explicitní
   přepočet.
4. Nastav `MAPY_API_ENABLED=false` a ověř, že ruční místo i uložení události
   fungují a route hlásí nedostupnost.

## Řešení problémů

- **Timeout:** zkontroluj egress/DNS backendu, případně opatrně uprav
  `MAPY_API_TIMEOUT_MS`; událost se nesmaže a přepočet lze opakovat.
- **401:** klíč chybí, je neplatný nebo byl rotován. Nezobrazuj jeho hodnotu v
  terminálu či issue.
- **403:** projekt/klíč nemá povolenou službu nebo nesedí IP omezení.
- **Vyčerpané kredity / limit:** ověř účet projektu a spotřebu; nesnižuj
  rate-limit. Ruční textové místo zůstává fallback bez routingu.
- **Prázdné návrhy:** ověř délku dotazu, jazyk a podporované typy; nejde nutně o
  výpadek.

Aktuální technické zdroje jsou oficiální dokumentace
[Geocoding/Suggest](https://developer.mapy.com/rest-api-mapy-cz/function/geocoding/),
[Routing](https://developer.mapy.com/rest-api-mapy-cz/function/routing/),
[Suggest tutorial](https://developer.mapy.com/rest-api-mapy-cz/tutorials/suggest/),
[podmínky](https://developer.mapy.com/terms-and-conditions/),
[zabezpečení klíče](https://developer.mapy.com/my-account/api-key-security/) a
[attribution](https://developer.mapy.com/rest-api-mapy-cz/atribution/).
