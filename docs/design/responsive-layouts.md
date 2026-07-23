# Responzivní layouty

Breakpoints a rozměry jsou tokeny v `styles/tokens.css`; Tailwind používá CSS
media queries. Rozhodnutí se neopírá o jednorázové `window.innerWidth`.

## Compact: méně než 768 px

- sticky `MobileHeader` s HomeApp značkou, domácností, rychlým přidáním a user menu;
- jeden obsahový sloupec s horizontálním paddingem 16 px;
- fixní `MobileBottomNavigation` se safe-area paddingem;
- položky Přehled, Finance, Úkoly, Dokumenty a Více;
- Více otevírá Radix bottom sheet s viditelnou volbou motivu;
- theme volby mají český název a nejméně 44px target;
- dashboard skládá header, attention, quick actions a agendu vertikálně;
- detail a dlouhý formulář jsou stránka, kontextové filtry sheet.

## Medium: 768 až 1199 px

- `TabletNavigationRail` má šířku 72 px;
- ikony mají přístupný název a Radix tooltip;
- `AppTopBar` obsahuje domácnost, připravené hledání, quick create a user menu;
- hlavní obsah používá jeden nebo dva sloupce;
- není zobrazen sidebar, bottom navigation ani trvalý inspector.

## Expanded: od 1200 px

- `DesktopSidebar` má 248 px a lze jej sbalit do 72px `CollapsedSidebar`;
- topbar má 64 px;
- obsah je omezen na 1440 px a dashboard používá 12sloupcovou mřížku;
- search, quick create, household switcher a user menu jsou v topbaru;
- volba motivu je radio menu v user menu;
- budoucí kontextový panel není v této iteraci vykreslen.

## Přístupnost a reflow

Skryté navigační varianty používají `display: none`, takže nejsou ve focus ani
accessibility tree. Jediný `main` obsah se neduplikuje. Interaktivní targets
mají nejméně 44 × 44 CSS px. Skip link vede na `#main-content`, overlay vrací
focus a bottom navigation respektuje safe area.

Automatické testy pokrývají 360×800, 390×844, 430×932 a 768×1024 pro reflow a
vizuální baseline 390×844 dark/light, 768×1024 dark, 1280×800 light a
1440×900 dark. Samostatně se ověřuje 200% text a horizontální overflow.
