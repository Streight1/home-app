# Modulární hranice

HomeApp je modulární monolit. Jedna databáze a jeden API proces umožňují
transakce napříč technickými adaptéry, ale nejsou oprávněním k přímému přístupu
do interní vrstvy jiné domény.

## Backend

Každý funkční modul vlastní presentation, application, domain a infrastructure
vrstvu v rozsahu odpovídajícím své složitosti. Controller mapuje HTTP kontrakt,
aplikační služba orchestruje use case, doména drží pravidla a repository porty a
infrastruktura implementuje Prisma nebo externí adaptéry.

Přesah do jiné domény vede pouze přes úzký veřejný kontrakt:

- command/query facade, například `TasksFacade` nebo `DocumentsFacade`;
- explicitní read-only summary;
- společný technický port, jehož token vlastní veřejná hranice;
- stabilní doménový interface bez Prisma entity a HTTP DTO.

Zakázaný je přímý import cizího controlleru, Prisma repository, interní use-case
služby nebo persistence DTO. Search je referenční příklad: jednotlivé moduly
registrují `ApplicationSearchProvider` pod veřejným tokenem a orchestrátor
injektuje agregovaný seznam providerů. `SearchModule` nezná konkrétní třídy ani
jejich repositories.

Každý modul zůstává odpovědný za household scope, lifecycle filtry a bezpečnou
projekci vlastních dat. Společný orchestrátor tato pravidla nenahrazuje.

## Frontend

Feature vlastní API klienta, query keys, hooks, schema, komponenty a workspace
host. Cross-feature nebo app-shell konzument importuje pouze explicitní
`<feature>.public.ts`. Public entrypoint exportuje jen skutečné integrační body;
není to barrel celého adresáře.

Workspace registry a overlay host načítají feature přes dynamický import public
entrypointu. Tím zůstává registr jediným mapperem navigačního targetu a zároveň
nevkládá všechny workspace a dialogy do prvního produkčního chunku.

Feature smí uvnitř sebe používat interní cesty. Public entrypoint se nevytváří
pro oblast, kterou žádný jiný modul nepoužívá. Dashboard, command palette a
globální nabídka `Přidat` nesmějí kopírovat formulář nebo mutation logiku; volají
existující overlay target.

## Kontrola hranic

`pnpm architecture:check` hlídá zejména:

- Search orchestrátor bez importu konkrétního provideru;
- app registry bez statického hlubokého feature importu;
- dynamické registry importy pouze přes `*.public.js` a společnou chunk-recovery
  hranici;
- persistence workspace stavu bez volného finančního search textu;
- existující bezpečnostní a velikostní invariants projektu.

Počet řádků není sám o sobě důvod k rozdělení. Refaktor je oprávněný, pokud
oddělí odpovědnosti, zmenší vazbu, odstraní duplicitní pravidlo nebo prokazatelně
zlepší načítání či testovatelnost.

## Vědomě ponechané přesahy

Historické cykly Auth/Households, Calendar/Location a části Finance vyžadují
širší návrh facade kontraktů. V této stabilizační iteraci se nepřepisují bez
behaviorální potřeby. Jejich stav a priorita jsou zachycené v
[refaktorizačním auditu](refactoring-audit.md).
