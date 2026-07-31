# Architektura celoaplikačního hledání

## Federovaná hranice

`SearchModule` vlastní HTTP kontrakt, orchestraci, timeouty, společný ranking a
výsledkové DTO. Nevlastní doménová data a neimportuje Prisma repositories
ostatních modulů. Domény exportují read-only `ApplicationSearchProvider`:

```ts
interface ApplicationSearchProvider {
  readonly providerKey: SearchProviderKey;
  readonly supportedTypes: readonly SearchEntityType[];
  search(
    context: SearchContext,
    request: ModuleSearchRequest,
  ): Promise<ModuleSearchCandidate[]>;
}
```

Konkrétní provider třída zůstává privátní ve svém modulu. Modul ji registruje
přes `useExisting` pod stabilním tokenem z
`APPLICATION_SEARCH_PROVIDER_TOKENS` a exportuje jen tento token. Composition
root Search modulu sestaví agregovaný `APPLICATION_SEARCH_PROVIDERS_TOKEN` v
jediném deklarovaném pořadí. `SearchService` proto injektuje pouze
`readonly ApplicationSearchProvider[]` a při přidání provideru neimportuje jeho
interní cestu.

Provider vlastní searchable pole, household-scoped databázový dotaz, bezpečný
prezentační mapping a typovaný `SearchNavigationTarget`. Orchestrátor nejprve
odvodí aktivní membership a roli, vybere providery podle filtru a spustí je
paralelně přes `Promise.allSettled` s omezeným timeoutem. Provider failure se
loguje pouze bezpečným klíčem a response jej označí jako partial.

Neexistuje centrální tabulka všech entit ani ruční SQL union napříč doménami.
Search modul proto nemůže obejít lifecycle filtry, household scope nebo
bezpečnou projekci Finance a Documents.

## Normalizace a indexy

Sdílená čistá normalizace odstraní diakritiku, sjednotí case a whitespace.
Databázová migrace `20260731140000_global_application_search` přidává pouze
trusted rozšíření `unaccent` a `pg_trgm`, immutable funkci
`homeapp_search_normalize(text)` a GIN trigram indexy. Migrace nemění ani
nemaže doménové řádky.

Modulové query používají parametrizované `Prisma.sql`; uživatelský text se
neskládá do SQL řetězce. Každý dotaz současně filtruje serverem odvozený
`householdId` a běžný lifecycle stav, například `deletedAt IS NULL` nebo
`archivedAt IS NULL`.

## Veřejný výsledek

Provider candidate obsahuje interní pole pro ranking. Teprve `SearchService`
vytvoří stabilní veřejný model s title, krátkým plain-text snippetem,
matched-field labelem, normalizovaným score a validovaným workspace targetem.
Nevrací libovolnou URL, HTML, household ID, Prisma entitu, storage key, auditní
data ani raw finance/import metadata.

Ranking používá společný rozsah 0–1. Exact title má 1, prefix názvu má přednost
před běžnou title shodou a nižší field weights řadí popis nebo delší text níže.
Recency přidává nejvýše malý boost.

## Frontend

`GlobalSearchPalette` je jediný adaptivní dialog v `AppShell`. API vrstva
posílá POST body, hook vlastní debounce a cancellation a response se
nepersistuje. Výsledkový target prochází stejným parserem jako workspace
history, než jej frontend otevře. Command actions volají existující overlay
registry; nevytvářejí search-specific formuláře.

Recent storage je samostatný versioned adapter. React komponenty nečtou více
ad-hoc localStorage klíčů. Search dotaz ani response snippet se nikdy
nepersistují.

## Bezpečnostní invarianty

- endpoint je autentizovaný POST, nikoli GET query;
- response je `private, no-store` a request má rate limit;
- dotaz není auditovaný ani logovaný;
- každý provider musí použít `SearchContext.householdId`;
- navigation target je diskriminovaný allowlist s UUID validací;
- Finance projekce nezná bankovní účet protistrany, fingerprint ani raw import;
- architektonická kontrola zakazuje centrální Prisma/SQL v Search modulu,
  import konkrétních providerů, libovolné URL targety, GET search a kopírování
  formulářů do palety.
