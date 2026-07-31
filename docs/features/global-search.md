# Celoaplikační hledání a command palette

## Uživatelské chování

Hledání je součástí horní části `AppShell`, nikoli samostatná položka hlavního
menu. Na desktopu jej otevře tlačítko **Hledat v aplikaci** nebo
`Ctrl+K`/`Cmd+K`; na telefonu stejné tlačítko otevře full-screen dialog.
`Escape` dialog zavře, šipky mění aktivní položku a `Enter` ji otevře.
Po zavření se focus vrátí na původní prvek.

Bez dotazu paleta nabízí navigační a rychlé příkazy. Vytváření používá pouze
existující overlay registry a centrální dialogy; `VIEWER` vidí navigaci, ale ne
zakázané create akce. Po zadání alespoň dvou znaků se výsledky seskupí do
oblastí Dokumenty, Úkoly a údržba, Kalendář, Finance, Recepty a jídlo,
Výpravy a výbava a Ostatní.

Výsledek otevírá validovaný interní workspace target. Viditelná URL zůstává
`/app`; Back/Forward a reload používají stávající workspace navigaci.
Maintenance se otevírá jako sekundární část hlavní oblasti Úkoly. Recept,
výprava, dokument, úkol, událost, transakce a bucket položka mají konkrétní
detail target; výbava a gearlist zvýrazní konkrétní kartu příslušné sekce.

## Podporované oblasti

- Dokumenty: název, typ, popis, poznámka, potvrzená metadata a potvrzené
  extraction kandidáty. Binární soubor se při requestu nečte a snippet má
  nejvýše 180 znaků.
- Úkoly a údržba: název, popis, kategorie, místo, bezpečné participant summary,
  dodavatel a lokalita plánu.
- Kalendář: název, místo, bezpečný popis a participant summary. All-day datum
  je date-only a technický exclusive konec se nevrací.
- Finance: protistrana, normalizovaný obchodník, uživatelský popis, poznámka,
  kategorie a název účtu. Částky, protistranový účet, fingerprint, externí
  bankovní identifikátory a raw import metadata response neobsahuje.
- Bucket list: název, popis, místo, rok a účastníci.
- Meals: recepty včetně kategorií, tagů a surovin; jídelníček, otevřené
  nákupní položky a pantry.
- Výpravy: výpravy, výbava podle názvu/značky/modelu/kategorie a gearlist
  šablony.

## Dotaz, filtry a odezva

Frontend používá debounce 250 ms a každý zastaralý request ruší přes
`AbortController`. Hledání není ukládáno do persistentní React Query cache.
Filtry posílají explicitní seznam typů a server omezuje výsledek na deset
položek na oblast a padesát položek celkem.

Backend normalizuje Unicode do podoby bez české diakritiky, sjednotí casing a
mezery. PostgreSQL používá nedestruktivně zapnuté `unaccent`, `pg_trgm` a GIN
výrazové indexy nad hlavními názvy. Ranking upřednostňuje přesný název, prefix
názvu, další shodu názvu, strukturovaná pole a teprve potom delší text;
recency boost je malý a nikdy nepřekoná přesný starší název.

Každý doménový provider běží samostatně s timeoutem. Selhání jedné oblasti
vrátí `partial: true` a bezpečný seznam nedostupných providerů, zatímco ostatní
autorizované výsledky zůstanou viditelné. UI nerozlišuje neexistující a
nepřístupné záznamy.

## Soukromí

Dotaz se posílá pouze jako JSON body `POST /api/v1/search`; není v URL,
workspace historii, recent položkách, auditu ani aplikačním logu. Endpoint
vrací `Cache-Control: private, no-store` a má interaktivní rate limit.
Loguje se pouze doba, počet providerů/výsledků a bezpečný klíč nedostupného
provideru.

Recent položky jsou maximálně deset bezpečných targetů na uživatele v
namespacovaném `localStorage`. Obsahují jen provider, druh entity, krátký title,
validovaný target a čas otevření. Neukládají dotaz, subtitle ani snippet;
finance výsledky se do recent historie nezapisují. Odhlášení historii smaže.

## Známá omezení

- První verze je federované substring/prefix hledání, nikoli sémantické nebo
  fuzzy hledání s překlepy.
- `Zobrazit vše` zvyšuje omezený počet výsledků v paletě; nevytváří samostatnou
  veřejnou search route.
- Odškrtnuté nákupní položky se výchozím hledáním nezobrazují a první verze
  nemá pokročilý query jazyk ani hledání podle finanční částky.
