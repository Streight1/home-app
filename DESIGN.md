# HomeApp Aurora design system

HomeApp Aurora je původní projektový design systém pro praktickou správu
domácnosti. Tento dokument je autoritativním zdrojem vizuálních a interakčních
pravidel. Produktové použití rozvádí [design dokumentace](docs/design/README.md)
a strojovou implementací jsou tokeny v `apps/web/src/styles/tokens.css`.

Veřejná ukázka Reflect na GetDesign byla použita pouze jako inspirace pro
obecný tmavý, indigový a technologický charakter. HomeApp Aurora není oficiální
design systém Reflect a nekopíruje jeho značku, texty, assety, screenshoty ani
landing-page layout.

## Filozofie

Aurora spojuje klidné pracovní prostředí s jasnou moderní identitou. Rozhraní
má být důvěryhodné pro citlivou domácí agendu, rychle čitelné při každodenním
použití a přesvědčivé i bez dat.

- hluboká modročerná plátna v dark motivu a chladné neutrální plátno v light;
- fialový primární akcent doplněný modrou a cyan pouze pro orientaci;
- jasná typografická hierarchie a kompaktní informační hustota;
- border a změna povrchu mají přednost před stínem;
- glow a gradient jsou vzácné akcenty, ne výchozí vzhled každé karty;
- stav musí být srozumitelný textem, strukturou nebo ikonou, nikdy jen barvou;
- neexistující business funkce zůstává disabled a označená „Připravujeme“.

## Motivy

Aplikace podporuje preference `system`, `light` a `dark`; výchozí je `system`.
V systémovém režimu se aktivní motiv mění živě podle
`prefers-color-scheme`. Uživatelská volba se ukládá pouze pod klíčem
`homeapp.theme`; autentizační údaje do localStorage nepatří.

Před React bootstrapem nastaví inline pre-hydration skript v `index.html`
atributy `data-theme` a `data-theme-preference`, CSS `color-scheme` a meta
`theme-color`. Tím se zabrání flashnutí nesprávného motivu. Produkční
komponenty nesmějí atributy motivu nastavovat samy.

## Barevné tokeny

Tokeny mají sémantické názvy a komponenta nezná jejich HEX hodnotu. Základní
dark paleta používá canvas `#08070d`, surface `#11101a`, raised surface
`#181522`, text `#f5f3fa` a primary `#8b6cff`. Základní light paleta používá
canvas `#f6f5f9`, surface `#ffffff`, text `#1d1925` a primary `#6c4ff8`.

Implementované skupiny:

- plátna: `canvas`, `canvas-subtle`, `background`;
- povrchy: `surface`, `surface-raised`, `surface-subtle`, `surface-hover`;
- kontext: `selected`, `input`, `sidebar`, `bottom-navigation`, `overlay`;
- text: `text`, `text-secondary`, `text-muted`, `text-subtle`;
- hranice: `border`, `border-strong`;
- značka: `primary`, `primary-hover`, `primary-emphasis`, `primary-soft`,
  `primary-foreground`, `accent-blue`, `accent-cyan`;
- stavy: `danger`, kontrastní `danger-foreground`, `warning`, `success`, `info`
  a jejich soft surfaces;
- systém: `focus`, disabled foreground/surface, skeleton, scrollbar a glow;
- data: čtyři budoucí chart series bez produkčních demo grafů.

`primary-emphasis` je kontrastnější textová varianta pro selected surface;
primární CTA používá `primary` jako povrch. Toto oddělení je povinné, protože
stejná barva nemusí splnit AA jako malé písmo i jako tlačítko.

Gradient smí existovat jen jako sémantický token. `gradient-aurora` patří na
login pozadí, `gradient-primary` na hlavní CTA a značku a `gradient-header` na
jediný dashboard header. Glow je povolený pro značku, primární CTA, aktivní
navigaci, focus nebo vybraný stav. Běžné pracovní karty glow nepoužívají.

## Typografie

UI používá lokálně bundlovaný open-source Inter ve vahách 400, 500, 600 a 700;
fallback je systémový sans-serif stack. Vzdálené font CDN a proprietární fonty
jsou zakázané.

- desktop page title: 28–32 px, váha 600 až 650;
- mobile page title: 24–26 px, váha 600 až 650;
- display: nejvýše 40 px pro omezený hero nebo velký header;
- section title: 17–19 px, váha 600;
- body: 14–16 px, váha 400;
- metadata: 12–13 px, váha 450 až 500.

Částky, datumy, statistiky a tabulkové sloupce používají tabulkové číslice.
Nadpisy nejsou gradientní a produktové obrazovky nepoužívají marketingovou
hyperbolu.

## Spacing, radius a rozměry

Spacing používá 4px základ: 4, 8, 12, 16, 20, 24, 32, 40, 48 a 64 px.
Horizontální padding compact obsahu je 16 px. Touch target má nejméně 44 × 44
CSS px.

- `radius-sm` 8 px: malé ovládací prvky;
- `radius-md` 12 px: input, button a menu item;
- `radius-lg` 16 px: karty, menu a dialog;
- `radius-xl` 20 px: výrazný header nebo velký sheet.

Pill radius je vyhrazen pro badge, avatar a skutečně kruhové ovládání. Radius
nesmí změnit pracovní UI v galerii obřích zaoblených karet.

Layout tokeny definují content max 1440 px, reading max 736 px, sidebar 248 px,
rail 72 px, topbar 64 px, mobilní header 64 px a bottom navigation 72 px plus
safe area.

## Elevation

`shadow-sm` oddělí header nebo pracovní surface, `shadow-md` patří menu a
popoveru, `shadow-lg` dialogu nebo sheetu. Border zůstává primární separátor.
Stín ani poloprůhlednost nesmí snižovat kontrast textu. Glassmorphism není
součástí systému.

## Ikony

Jedinou ikonovou knihovnou je Lucide. Ikona má 16–20 px podle kontextu,
konzistentní stroke a význam doplněný viditelným textem nebo přístupným názvem.
Dekorativní ikona má `aria-hidden="true"`. Ikonové tlačítko vyžaduje přesný
`aria-label`; několik ikonových knihoven v jedné aplikaci je zakázáno.

## Motion

Tokeny používají fast 130 ms, standard 185 ms a slow 260 ms s easingem
`cubic-bezier(0.2, 0, 0, 1)`. Motion vysvětluje otevření menu, sheetu a dialogu,
hover nebo změnu aktivního prvku. Nekonečné dekorativní animace nejsou povolené.

Při `prefers-reduced-motion: reduce` se posunové animace a pulzující glow
vypnou, přechody jsou prakticky okamžité a skeleton je statický.

## Stavy komponent

Každá použitá interaktivní komponenta má light i dark podobu a podle smyslu:

- default, hover a active;
- jasný `focus-visible` ring;
- disabled stav, který nepůsobí aktivně, ale zůstává čitelný;
- loading přes `aria-busy` a blokaci opakované akce;
- error přes text, `aria-invalid` a sémantickou barvu;
- klávesové ovládání a dostupné jméno.

Radix primitives zajišťují focus management pro dropdown, tooltip, dialog a
sheet. Focus se po zavření overlay vrací na spouštěcí prvek. Barva není jediným
nositelem selected, error ani success stavu.

## Responzivní pravidla

### Compact pod 768 px

Sticky mobile header, jeden obsahový sloupec, 16px padding a bottom navigation
se safe area. Navigace obsahuje Přehled, Finance, Úkoly, Dokumenty a Více.
Desktop sidebar ani rail se nesmějí objevit ve focus nebo accessibility tree.
Detail a dlouhý formulář jsou stránka, filtry bottom sheet.

### Medium 768 až 1199 px

72px navigation rail, topbar a jeden až dva obsahové sloupce. Ikonová navigace
má tooltip nebo přístupný název. Kontextová editace může použít drawer; trvalý
inspector se nevykresluje.

### Expanded od 1200 px

248px sidebar sbalitelný na 72 px, 64px topbar a obsah nejvýše 1440 px. Topbar
obsahuje household switcher, připravené hledání, rychlé přidání a user menu.
Neimplementované prvky jsou viditelně disabled.

## Dashboard

Dashboard není galerie KPI. Pořadí je:

1. header a přivítání;
2. Vyžaduje pozornost;
3. Rychlé akce;
4. Dnešní úkoly;
5. další oblasti pouze s reálnými daty.

Produkce nezobrazuje demo částky, dokumenty ani termíny. Prázdné stavy mají
jasný nadpis, vysvětlení a nanejvýš pravdivě disabled akci. Fixture data patří
výhradně do Storybook/test adresářů.

## Formuláře

Label je vždy viditelný; placeholder není náhrada labelu. Input, textarea,
select, checkbox, radio a switch používají input surface, 44px control height,
kontrastní border, focus ring, disabled a error text. Dlouhý formulář se na
mobilu otevírá jako stránka, nikoli stísněný dialog. Chyba popíše problém a
bezpečný další krok.

## Seznamy a tabulky

Seznam používá stabilní hierarchii názvu, metadata a akce. Na compact šířce se
tabulka mění na skutečně navržený seznam nebo povolí řízený horizontální scroll
s jasným kontextem; nesmí se jen zmenšit. Číselné sloupce jsou zarovnané a mají
tabulkové číslice. Sticky header a zebra rows se používají pouze tehdy, když
zlepšují práci s reálnými daty.

## Empty, loading a error

- empty: pravdivý stav bez ilustrace či demo dat, s jedním dalším krokem;
- loading: `LoadingScreen`, spinner nebo skeleton stejného tvaru jako obsah;
- error: `InlineAlert` nebo error boundary s českým popisem a bezpečnou akcí;
- skeleton nesmí blikat při reduced motion;
- loading session nikdy krátce nezobrazí chráněný obsah.

## Přístupnost

Cílem je WCAG 2.2 AA: text nejméně 4.5:1, velký text a významové objekty 3:1,
viditelný focus, správné landmarky a heading pořadí, skip link, klávesová
obsluha, screen-reader labels, 200% zoom a reflow bez horizontálního scrollu.
Overlay musí jít zavřít Escape a mobilní akce nesmí ležet pod bottom navigation.
Automatické axe kontroly doplňuje vizuální prohlídka definovaných viewportů.

## Zakázané vzory

- hardcoded HEX, RGB nebo HSL v React komponentách;
- druhý theme provider nebo theme logika v business stránce;
- ukládání preference mimo `homeapp.theme` či autentizace do localStorage;
- gradientní běžné nadpisy, glow na každé kartě a animované neonové pozadí;
- glassmorphism s nízkým kontrastem;
- falešné statistiky, grafy, částky, dokumenty a termíny;
- kopírování značky, loga, textů, ilustrací, screenshotů nebo layoutu Reflect;
- proprietární nebo vzdáleně načítané fonty;
- produkční import Storybook fixture;
- aktivní ovládání neimplementované funkce.
