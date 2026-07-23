# Workspace navigace

## Stav

Implementováno pro všechny současné aplikační oblasti.

## Účel

Udržet browserovou adresu jednoduchou (`/login`, `/app`) bez názvů feature a
UUID, ale zachovat Back, Forward, reload a důležité adaptivní dialogy.

## Uživatelské scénáře

- otevření seznamu, detailu a návrat browser tlačítkem;
- zavření preview/create/edit overlay přes Back a opětovné otevření přes Forward;
- bezpečné obnovení posledního view po reloadu;
- vyčištění stavu při odhlášení.

## Uživatelské rozhraní

Sidebar, rail, bottom navigation, feature hosty a `WorkspaceLink` používají
jediný `WorkspaceNavigationProvider`. Viditelná URL zůstává `/app`; stará
feature route skončí fallbackem bez zpřístupnění dat.

## API

Workspace navigation nemá backendový endpoint. Skrytí interní cesty není
autorizace; každý feature endpoint zůstává deny-by-default.

## Datový model

Diskriminovaný `WorkspaceView` a volitelný `WorkspaceOverlay` se ukládají pod
`homeAppWorkspace` v `history.state` a pod `homeapp.workspace.navigation` v
sessionStorage. Povolená pole jsou `area`, `screen`, `overlay.kind`, nutná UUID
a volitelné datum create dialogu. Žádná metadata, názvy, částky ani tokeny.

## Autentizace a oprávnění

Provider existuje uvnitř chráněné aplikace a při logoutu se vyčistí. API
session, household scope a role jsou stále jediná bezpečnostní hranice.

## Validace a chybové stavy

Parser používá přesný allowlist view/overlay variant a UUID v4. Neplatný JSON,
neznámá oblast nebo chybný identifikátor spadne na dashboard. Nepřístupnou nebo
smazanou entitu odmítne příslušný API request bezpečnou 404.

## Testy

Unit testy pokrývají výchozí dashboard, odmítnutí invalidního stavu,
namespacovaný storage, stálou `/app`, history restore a cleanup. Architektonická
kontrola zakazuje browser route pod `/app/...` a přímý sessionStorage mimo
navigační vrstvu.

## Známá omezení

Entity nejsou veřejně deep-linkovatelné a stav se nesynchronizuje mezi panely
prohlížeče. Malá menu a tooltipy nejsou history entries.

## Budoucí možnosti

Případné bezpečné sdílené odkazy musí být nová explicitní funkce s vlastní
autorizací; nesmí obfuskovat interní UUID v URL.
