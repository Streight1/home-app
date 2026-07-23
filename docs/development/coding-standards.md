# Coding standards

## TypeScript a moduly

- Používej TypeScript strict mode, ESM a konzistentní `.js` přípony relativních importů.
- Nepoužívej `any`, `@ts-ignore`, mrtvý zakomentovaný kód ani TODO místo povinné implementace.
- Interní názvy tříd, funkcí, API a databázových polí jsou anglicky; uživatelské texty česky.
- Importuj typy pomocí `import type`, pokud nemají runtime hodnotu.

## Feature a modulové hranice

- Nová frontendová oblast patří do `features/<feature>`.
- `main.tsx` je pouze bootstrap; `App.tsx` pouze kompozice providerů a routeru.
- Stránky skládají menší komponenty a neprovádějí přímý data fetching.
- Backend controller pouze mapuje HTTP a veřejná DTO; databáze patří do služeb.
- Externí integrace a storage používají port/adaptér a dependency injection.
- Household dotaz musí projít `HouseholdAccessService`.

## Velikost a odpovědnost

- `main.tsx` má být přibližně do 30 řádků a `App.tsx` do 80 řádků.
- React komponenta má obvykle nejvýše 150 řádků.
- Produkční TypeScript/TSX soubor má obvykle nejvýše 300 řádků.
- Neděl soubor mechanicky podle řádků; rozděl jej při více odpovědnostech.
- Nevytvářej nesouvisející `utils.ts`, globální `types.ts` nebo hromadný `components.tsx`.

Limity a public endpoint policy ověřuje `pnpm architecture:check`.

## DTO a veřejné odpovědi

- Vstupní DTO validuj, whitelistuj a odmítej neočekávaná pole.
- Nikdy nevracej Google subject, token hash, raw token, cookies nebo nepotřebná interní pole.
- Databázové entity mapuj na explicitní veřejné response struktury.
- Používej správné HTTP statusy a stabilní interní error codes.

## Chyby a logování

- Očekávané chyby reprezentuj bezpečnou `ApiException`.
- Nevracej stack trace klientovi a neloguj credential, cookies, Authorization,
  session token, CSRF token ani celé login body.
- Neprozrazuj existenci cizích household entit rozdílnou chybou.

## UI a design

- Před UI změnou přečti celý `DESIGN.md` a `docs/design/README.md`.
- Používej sémantické tokeny v `styles/tokens.css`, ne náhodné HEX barvy.
- Zachovej focus-visible, klávesovou ovladatelnost, správnou sémantiku a touch
  target nejméně 44 × 44 CSS px.
- Compact, medium a expanded shell jsou samostatné komponenty řízené CSS media
  queries. Nepoužívej jednorázové čtení viewportu.
- Radix primitives používej pro dialog, sheet, menu a tooltip; zdrojový kód
  obalů zůstává lokální a používá projektové tokeny.
- Storybook fixture nesmí být importovaná produkčním souborem a nevytvářej
  produkční `/design-preview` route.
- Nevytvářej falešná data, statistiky, grafy nebo aktivní ovládání nehotové funkce.
