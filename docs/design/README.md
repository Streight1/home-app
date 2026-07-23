# Produktový design HomeApp Aurora

Tato složka převádí závazná pravidla z kořenového [DESIGN.md](../../DESIGN.md)
do konkrétního produktu, obrazovek, responzivních režimů a komponent. Aurora je
vlastní design systém HomeApp pro system, light a dark motiv.

- [Product UI brief](product-ui-brief.md) — charakter, cíle a hranice vizuálního směru.
- [Responsive layouts](responsive-layouts.md) — compact, medium a expanded kompozice.
- [Screen map](screen-map.md) — současné obrazovky, stavy a navigační vazby.
- [Component inventory](component-inventory.md) — implementované primitives a shell komponenty.
- [Reference board](reference-board.md) — obecná inspirace Reflect a hranice kopírování.
- [Content guidelines](content-guidelines.md) — tón a pravidla českých UI textů.

Při přidání komponenty nejdřív ověř, že ji současný produkt skutečně používá.
Potom použij sémantické tokeny z `apps/web/src/styles/tokens.css`, doplň light,
dark, focus, disabled a error/loading stav podle smyslu a přidej relevantní test
nebo story. Produkční kód nesmí importovat story fixture.

Storybook se spouští přes `pnpm storybook`; screenshot a accessibility kontroly
popisuje [testovací dokumentace](../development/testing.md).
