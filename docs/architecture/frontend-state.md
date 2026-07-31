# Frontendový stav a cache

Frontend odděluje serverová data, interní workspace navigaci, transientní
formulářový stav a lokální UI preference. Jedna informace nesmí být současně
udržovaná v několika těchto vrstvách bez explicitního důvodu.

## Workspace navigation

Jediným modelem je validovaný diskriminovaný `WorkspaceView` a
`WorkspaceOverlay`. History API a namespacovaný sessionStorage obsluhuje pouze
`app/workspace-navigation`; viditelná URL zůstává `/app`.

Persistovat lze area/screen, allowlistované enumy, UUID a nezbytný date-only
výběr. Nepersistují se hledané fráze, názvy, poznámky, finance protistrany,
adresy ani API response. Finance drill-down proto drží volný textový query filtr
jen v transientním list state, zatímco bezpečné category/date filtry mohou být
součástí validovaného workspace targetu.

## Overlaye a formuláře

Overlay target pouze popisuje záměr. `WorkspaceOverlayHost` lazy-loaduje
feature-owned dialog přes public entrypoint. Dashboard, globální `Přidat` a
command palette používají stejný target, schema, formulář a mutation hook.

Form state zůstává v otevřeném dialogu. Při API chybě se nezahodí; při úspěchu
se zavře stejnou centrální cestou. Overlay state neobsahuje celý draft, pokud
postačí bezpečný zdroj a několik validovaných hodnot.

## React Query

Každá feature vlastní query key factory nebo stabilní veřejný root key. Mutace
invaliduje nejmenší soubor skutečných konzumentů:

- příslušný list nebo detail;
- vlastní dashboard summary, pokud jej změna ovlivní;
- explicitní veřejný key jiné feature při skutečném cross-module lifecycle.

`invalidateQueries()` bez key a fiktivní keys jsou zakázané. Optimistic update
musí před změnou uložit přesnou předchozí cache a při chybě ji obnovit. Search
response používá jen krátkou in-memory cache a nikdy persistentní storage.

## Lokální preference

Theme, sidebar a recent search items mají každý jediný verzovaný storage
adaptér. React komponenty nečtou několik ad-hoc klíčů stejné preference.
Odhlášení nebo změna identity vyčistí user-scoped recent items; neukládají se
snippety ani dotazy.

## Lazy loading a chyby

Hlavní workspace a dialogy jsou samostatné produkční chunks. Registry obaluje
dynamický import `Suspense` fallbackem a zachovává error boundary aplikace.
Code splitting nesmí měnit navigační target, URL, role ani formulářový
lifecycle. Jeho velikostní dopad se měří nad produkčním buildem, nikoli podle
počtu dynamických importů.

Stale deployment chunk může vyvolat nejvýše jeden automatický reload. Session
marker verze `v2` obsahuje stabilní target selhaného importu a smaže jej pouze
úspěch stejného targetu. Paralelně načtený nesouvisející workspace proto
neodblokuje další reload chybujícího overlaye; běžná chyba dál propadne do
error boundary.
