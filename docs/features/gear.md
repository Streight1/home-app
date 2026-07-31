# Výbava pro výpravy

## Katalog a přesná hmotnost

`GearItem` je household položka katalogu. Obsahuje název, značku, model,
kategorii, vlastníka, sdílenost, výchozí množství, typ zatížení, kritičnost a
hmotnost v celých gramech. `weightStatus` rozlišuje `VERIFIED`, `ESTIMATED` a
`UNKNOWN`; nulová hmotnost je platná jen jako výslovně neznámá. Množství
používá Prisma `Decimal`, nikoliv JavaScript float jako zdroj pravdy.

Typ zatížení je:

- `CARRIED` — nesená nespotřební výbava a součást base weight;
- `WORN` — oblečená hmotnost mimo base weight batohu;
- `CONSUMABLE` — voda, jídlo a palivo započítané do startovní hmotnosti.

Kritičnost `REQUIRED`, `RECOMMENDED` a `OPTIONAL` je v UI vždy uvedená textem,
nejen barvou. Doporučené household kategorie vzniknou pouze explicitní,
idempotentní akcí správce.

## Fotografie a dokumenty

Výbava nemá vlastní file storage. `GearItemDocument` propojuje položku s
existujícím `Document` jako `PHOTO`, `MANUAL`, `RECEIPT` nebo `OTHER`.
Vlastní JPEG/PNG se nahrává běžným Documents API a položka může zvolit právě
jednu cover fotografii. Veřejné DTO obsahuje pouze bezpečný document summary,
nikoliv `storageKey`.

Přímý import internetového obrázku:

1. přijme pouze HTTPS bez credentials a vlastního portu;
2. před každým requestem i redirectem odmítne localhost, `.local`, privátní,
   link-local, loopback, dokumentační a rezervované IP rozsahy;
3. DNS výsledek ověří a připne ke konkrétnímu requestu proti rebindingu;
4. omezuje timeout na 8 sekund, tři redirecty a 5 MiB;
5. podle hlavičky i signatury povolí pouze JPEG/PNG, nikoliv SVG;
6. odstraní JPEG APP/COM a nepotřebná PNG ancillary metadata;
7. vlastní kopii uloží přes `DocumentsFacade`.

Zdrojová URL a atribuce jsou metadata; běžné zobrazení obrázek nehotlinkuje.
Volitelný `GearImageSearchPort` pouze nabídne náhled, zdroj a autora. Uživatel
musí výsledek vybrat; bez provideru zůstává upload a přímá URL.

## Snapshoty

Výbava je zdrojem pro nový [gearlist](pack-lists.md) nebo položku konkrétní
[výpravy](expeditions.md). Tyto cíle kopírují název a jednotkovou hmotnost.
Změna katalogu proto nepřepíše historii. Explicitní update snapshotu má
read-only preview staré/nové hodnoty a potvrzovanou aplikaci.

## API a oprávnění

Autentizované API používá `/api/v1/gear`, `/api/v1/gear-categories`,
`/api/v1/gear/:gearItemId/documents`, `/image-from-url` a volitelný
`/api/v1/gear/image-search`. Čtení je od role `VIEWER`, zápis od `MEMBER` a
správa kategorií/archivace od `ADMIN`. Všechny vazby ověřují stejnou
domácnost.
