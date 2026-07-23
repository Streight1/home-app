# ADR 0003: Centralizovaná environment konfigurace

- Stav: přijato
- Datum: 2026-07-13

## Kontext

Compose, NestJS API a Vite původně používaly tři samostatné ukázkové `.env`
soubory. Stejné hodnoty, zejména porty, Google Client ID a názvy cookies, se
musely udržovat na více místech a mohly se nepozorovaně rozejít. Prisma navíc
spoléhala na pracovní adresář procesu.

## Rozhodnutí

Jediným lokálním zdrojem je kořenový `.env`, vytvořený z verzovaného
`.env.example`. Compose jej používá nativně. Nest ConfigModule a Prisma načítají
jeho kanonickou cestu odvozenou od umístění vlastního modulu, nikoli od
aktuálního pracovního adresáře. Vite používá kořen workspace jako `envDir`.

Hodnoty mohou odkazovat na dříve definované proměnné syntaxí `${NAME}`. Díky
tomu se například `WEB_ORIGIN`, `VITE_API_URL`, frontendové Google Client ID a
`DATABASE_URL` odvozují z jediné hodnoty. `API_PORT` a `WEB_PORT` mají odlišné
názvy, aby nebylo nejasné, kterému procesu patří.

Do browser bundlu vstupují pouze proměnné s prefixem `VITE_` a ne-citlivý název
CSRF cookie, který Vite explicitně odvodí z `CSRF_COOKIE_NAME`. Hesla,
`DATABASE_URL`, health token ani session hodnoty se klientovi nevystavují.
Backend nadále validuje všechny hodnoty, které spotřebovává, před startem.
Compose vyžaduje PostgreSQL proměnné bez skrytých fallbacků.

## Důsledky

Vývojář kopíruje a upravuje jediný soubor. Změna portu nebo Client ID se
propaguje do odvozených hodnot bez ruční duplicity. Nesmějí vznikat
`apps/api/.env` ani `apps/web/.env`; kontrola `pnpm environment:check` tuto
hranici, povinné klíče a bezpečné Vite prefixy ověřuje.

Produkční nasazení může hodnoty dodat prostředím procesu místo souboru, ale
musí zachovat stejné názvy a validaci. Samotný `.env` není mechanismus správy
produkčních tajemství a zůstává ignorovaný Gitem.
