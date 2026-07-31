# ADR 0004: Veřejné modulové kontrakty a provider tokeny

- Stav: přijato
- Datum: 2026-07-31

## Kontext

S růstem modulárního monolitu začaly orchestrátory a AppShell importovat
konkrétní provider třídy nebo interní feature komponenty. Funkce byly správné,
ale přímé závislosti zvyšovaly cykly, spojovaly build chunks a umožňovaly obejít
veřejnou projekci domény.

## Rozhodnutí

Backendové přesahy používají úzký facade/interface a veřejný injection token.
Více implementací společného portu se skládá v module composition rootu;
orchestrátor injektuje jen agregovaný interface. Frontendové app/layout registry
importují feature pouze přes explicitní `*.public.ts`; velké workspace a
overlaye se načítají dynamicky.

Public entrypoint není obecný barrel. Exportuje jen stabilní integrační
komponentu, hook, typ nebo query key, který má skutečného konzumenta.

## Důsledky

Doména zůstává vlastníkem autorizace, persistence a bezpečného response
mappingu. Search může přidat provider bez změny konstruktoru orchestrátoru a
frontend může rozdělit produkční bundle bez nové route. Za cenu explicitnější
registrace vzniká hranice, kterou lze staticky kontrolovat.
