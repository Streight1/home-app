# Sdílené doménové primitivy

Sdílená vrstva obsahuje pouze technickou semantiku, která je skutečně stejná ve
více modulech. Peníze, hmotnost, čas a množství zůstávají odlišné doménové
koncepty.

## Date-only

Backendovým zdrojem pravdy je `common/time/date-only.ts`. Poskytuje:

- striktní Gregorian validaci formátu `YYYY-MM-DD`;
- porovnání a serializaci bez implicitního timezone převodu;
- explicitní databázový adaptér pro PostgreSQL `DATE` reprezentovaný Prisma
  jako UTC půlnoc;
- výpočet aktuálního kalendářního dne v zadané IANA timezone.

Prezentační DTO používají společný `@IsDateOnly()` validator. Ten kontroluje
nejen tvar, ale i existující gregoriánský den; kalendářně nemožná hodnota je
odmítnutá před vstupem do aplikační služby. ISO instanty s časem nadále používají
samostatnou timestamp validaci.

Doménová hodnota je kalendářní den, nikoli instant. Konstrukce typu
`new Date("2026-07-29")` není date-only parser. Převod na `Date` je dovolený jen
na DB nebo kalendářní hranici, která zároveň vlastní opačný převod. DST testy
ověřují letní i zimní datum v `Europe/Prague`.

Recurrence používá tentýž validátor a date-only aritmetiku. Úkoly a Maintenance
si ponechávají odlišné lifecycle policy, ale neudržují vlastní Gregorian parser.
Explicitní UTC konstruktor používá `setUTCFullYear`, takže podporovaný rozsah
roků 0001–9999 nemění JavaScript roky 00–99 na 1900–1999; stejná hranice platí
pro weekday, recurrence i převod místního času.

Frontendovým zdrojem pravdy je `src/lib/date/dateOnly.ts`. Obsahuje stejnou
striktní Gregorian validaci, lokální serializaci, porovnání, posun kalendářního
dne a začátek týdne od pondělí. Nepřevádí date-only hodnotu přes implicitní UTC
`Date`; aktuální den odvozuje z explicitní IANA timezone. Feature helpery v
Calendar, Meals, Expeditions, Scheduling a Bucket listu delegují tuto technickou
semantiku a ponechávají si pouze doménové labely nebo adaptéry. Převod
all-day inclusive/exclusive hranice zůstává jediným explicitním adaptérem
Calendar knihovny, nikoli druhou date-only implementací.

Backend a frontend záměrně nesdílejí runtime balíček: každý má jeden kanonický,
frameworkově nezávislý helper a společnou testovanou smlouvu. To zabraňuje
přitažení Prisma nebo Node závislostí do browserového bundle.

## Decimal a přesná čísla

`common/numbers/decimal.ts` vlastní technickou validaci desetinného stringu a
stabilní serializaci Prisma Decimal. Veřejné API předává množství jako decimal
string; JavaScript `number` není zdroj pravdy pro recipe scaling ani gear
quantity.

Doménové vlastnictví zůstává oddělené:

- finance používají celé `BigInt` minor units;
- gear a weight summary používají celé gramy;
- recepty, pantry a pack quantity používají Decimal;
- duration zůstává celočíselný počet minut.

Společný helper proto neprovádí konverzi jednotek, money rounding ani součet
hmotností. Tato pravidla náleží příslušné doméně.

## Error a access hranice

Společné HTTP a API error adaptéry smějí sjednotit transportní tvar, status a
bezpečný fallback. Doménové kódy a české uživatelské zprávy zůstávají v modulu.
Household access helper ověřuje členství a roli, ale neabsorbuje doménové
lifecycle pravidlo.

## Pravidlo pro další sdílení

Nový shared primitive vznikne pouze tehdy, když alespoň dvě oblasti používají
stejnou semantiku a lze ji testovat bez frameworku. Podobný název nebo stejný
datový typ sám o sobě nestačí.
