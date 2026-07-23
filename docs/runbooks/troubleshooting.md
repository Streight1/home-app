# Troubleshooting

Než měníš data nebo konfiguraci, zachovej existující `database/postgres/` a
`uploads/`. Neřeš problémy resetem databáze. Bezpečné diagnostické příkazy můžeš
spouštět opakovaně.

Pro staging chyby DNS, Caddy ACME, portů 80/443, production cookies, migrace,
upload oprávnění a plného disku použij
[VPS deployment runbook](vps-deployment.md). Nejprve spusť
`./scripts/vps-preflight.sh --dry-run`; nevypisuje environment hodnoty a
nemění runtime adresáře.

## PostgreSQL není ready

```bash
docker compose ps
docker compose logs db
docker compose exec db pg_isready -U life_admin -d life_admin
```

Ověř kolizi `POSTGRES_PORT`, shodu přihlašovacích údajů s `DATABASE_URL` a práva
k `database/postgres/`. Adresář nemaž ani neupravuj za běhu PostgreSQL. Pokud je
readiness `503`, API běží, ale bezpečný databázový dotaz selhal.

## Port PostgreSQL je obsazený

Nastav volný host port v kořenovém `.env`, například změnou `POSTGRES_PORT`, a
stejný port použij v `DATABASE_URL`. Kontejnerový port zůstává 5432. Potom
bezpečně znovu vytvoř pouze Compose kontejner; bind-mounted data zůstanou.

## Prisma klient nebo migrace selhává

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

Použij Node 24 a pnpm verzi z `packageManager`. Zkontroluj, že databáze běží a
`DATABASE_URL` ukazuje na očekávanou instanci. Nikdy neupravuj již aplikovanou
migraci ani nespouštěj reset nad zachovanými daty; postup je v
[průvodci migracemi](../development/database-migrations.md).

## API odmítne nastartovat kvůli konfiguraci

Porovnej kořenový `.env` s `.env.example`. Povinný je mimo jiné
`INTERNAL_HEALTH_TOKEN` s alespoň 32 znaky, platný `DATABASE_URL`, přesný
`WEB_ORIGIN`, Google Client ID, session konfigurace, `UPLOAD_ROOT` a kladný
`MAX_UPLOAD_BYTES`. V production nesmí být `GOOGLE_ALLOWED_EMAILS` prázdný.
V single-household režimu musí být owner/název neprázdný a normalizovaný owner
musí být součástí allowlistu.
Ověř také, že používáš `API_PORT`, nikoli zastaralé obecné `PORT`, a že
odvozené `${VAR}` hodnoty nebyly nahrazeny neúplnou kopií.

## Google tlačítko se nenačte

Ověř síťové blokování GIS skriptu, Content Security Policy v browser rozšíření a
hodnotu `VITE_GOOGLE_CLIENT_ID`. Authorized JavaScript origin musí být přesně
`http://localhost:5173`; nepřidávej redirect URI pro callback popup flow.

## Google login je odmítnut

- `GOOGLE_CLIENT_ID` API musí být stejný Web Client ID jako ve frontendu.
- Účet musí mít ověřený e-mail a být v přesném `GOOGLE_ALLOWED_EMAILS`.
- `Origin` požadavku musí přesně odpovídat `WEB_ORIGIN`.
- V testovacím consent screenu musí být účet přidaný jako testovací uživatel.
- Systémový čas musí být správný kvůli expiraci ID tokenu.

Token nevypisuj do logu. Bezpečné nastavení popisuje
[Google OAuth runbook](google-oauth.md).

## Origin není povolený

`WEB_ORIGIN` musí být jediný přesný frontendový origin bez další cesty. Frontend
otevři ze stejného scheme, hostu a portu. Nepoužívej wildcard a nefalšuj hlavičku
Origin; pro produkci musí oba originy používat HTTPS.

## Účet není na allowlistu

Přidej přesnou e-mailovou adresu do čárkami odděleného
`GOOGLE_ALLOWED_EMAILS` v API konfiguraci a API restartuj. Backend hodnoty
trimuje a převádí na lowercase. Prázdný seznam je povolen pouze v developmentu.

## Sdílená domácnost ještě není inicializovaná

Chyba `HOUSEHOLD_OWNER_NOT_INITIALIZED` znamená, že se jako první pokusil
přihlásit MEMBER. Přihlas nakonfigurovaného ownera; nevytvářej memberovi vlastní
household ani nemaž databázi. Pokud owner vlastní více domácností, aplikace
záměrně neodhaduje správnou — stav je nutné vyřešit explicitně, ne podle názvu.
Odstranění e-mailu z allowlistu blokuje další login, ale již vydanou session je
pro okamžitý zákaz nutné revokovat nebo uživatele deaktivovat.

## Po reloadu se otevřel dashboard

Workspace obnovuje pouze validovaný `history.state` nebo namespacovaný
sessionStorage. Neplatná/stará varianta bezpečně spadne na dashboard. Browser
URL má zůstat `/app`; UUID ani názvy feature do URL/query/hash nepřidávej.

## Session po obnovení stránky zmizí

Browser requesty musí používat `credentials: "include"`. Ověř API URL, přesný
CORS origin a přítomnost `HttpOnly` session cookie pro cestu `/`. V production
funguje `Secure` cookie jen přes HTTPS. Neměň `SESSION_COOKIE_NAME` mezi vydáním a
ověřením session a ověř, že session není expirovaná, revokovaná nebo patří
disabled uživateli.

## Cookie se neukládá

Zkontroluj `credentials: "include"`, přesný CORS origin a browser cookie policy.
Frontend a API musí používat očekávané scheme a hosty; v production je nutné
HTTPS kvůli `Secure` cookie. Session token nikdy nepřesouvej do localStorage ani
sessionStorage.

## Logout nebo jiná mutace vrací CSRF chybu

Frontend musí poslat hodnotu cookie pojmenované podle `CSRF_COOKIE_NAME` v hlavičce
`X-CSRF-Token` a zároveň správný `Origin`. Session cookie nestačí. Pokud cookie
chybí, proveď nové přihlášení; nevypínej CSRF guard a nepřidávej wildcard CORS.

## Mutace hlásí, že server není dostupný

Nejdříve ověř `GET /api/v1/auth/me`. Pokud API vrátí HTTP odpověď, ale browser
hlásí síťovou chybu jen pro `PUT` nebo `DELETE`, zkontroluj v DevTools preflight
`OPTIONS`. `Access-Control-Allow-Methods` musí obsahovat obě metody a
`Access-Control-Allow-Origin` přesně odpovídat `WEB_ORIGIN`. Po změně backendu
restartuj celý `pnpm dev`; nespouštěj druhou Vite instanci přes proces, který už
drží `WEB_PORT`. Chybějící HTTP odpověď se záměrně nezobrazuje jako business
404/403, ale jako nedostupný server.

## Health endpoint vrací 401

Interní endpointy nepoužívají session. Pošli backendový token v
`X-Internal-Health-Token`; nedávej jej do Vite konfigurace ani URL. Ukázka bez
vloženého tajemství je v [lokálním vývoji](../development/local-development.md).

## Upload root není zapisovatelný

`UPLOAD_ROOT` se kanonicky řeší vůči kořeni workspace. Ověř existenci a práva
složky `uploads/`; API ji umí bezpečně vytvořit. Nepoužívej absolutní klientskou
cestu, `..` ani původní název jako storage key. Upload root není veřejný webový
adresář a přidání static middleware je bezpečnostní chyba.

## Dokumentový upload je odmítnutý

- `401`: session chybí, expirovala nebo byla revokována;
- `403`: nesouhlasí Origin/CSRF nebo má uživatel roli `VIEWER`;
- `413`: soubor překračuje serverové `MAX_UPLOAD_BYTES`;
- `415`: MIME typ, přípona nebo detekovaný obsah si neodpovídají, případně typ
  není v allowlistu PDF/JPEG/PNG/TXT/DOCX/XLSX;
- `400`: chybí název, soubor je prázdný nebo multipart obsahuje neplatná pole.

Neobcházej validaci přejmenováním přípony a nepřidávej obecný ZIP/HTML/SVG do
allowlistu. Při podezření na selhání po uploadu zkontroluj strukturované logy na
bezpečné kódy; neloguj request body, filename cestu, cookie ani obsah. Fyzický
soubor ručně nepřesouvej — konzistenci s databází řeš přes aplikační workflow.

## Dokument nelze stáhnout

Obecná `404` úmyslně nerozlišuje cizí dokument, chybějící metadata a chybějící
storage objekt. Ověř aktivní domácnost a členství, potom konzistenci
`DocumentFile` se storage přes interní diagnostiku. Nevystavuj `storageKey`
uživateli a nepřidávej dočasnou veřejnou static route.

## Náhled nebo vytěžení dokumentu nefunguje

PDF/JPEG/PNG/TXT preview používá autentizovaný Blob endpoint; zkontroluj session,
household a response `Content-Type`. DOCX/XLSX preview úmyslně není podporované.
Extrakce funguje pouze pro PDF s použitelnou textovou vrstvou. JPEG/PNG a sken
skončí bezpečným `OCR_NOT_CONFIGURED`, dokud nebude zapojen image OCR adapter;
nevytvářej náhradní data. `EXTRACTION_TIMEOUT` znamená překročení 20 sekund. Job
queue je in-process, takže po restartu může být rozpracovaný job potřeba spustit
znovu.

Pro lokální diagnostiku bez importu do aplikace použij:

```bash
pnpm extraction:evaluate --file /absolutni/cesta/faktura.pdf --type INVOICE
```

Výchozí výstup neobsahuje raw text ani normalizované hodnoty. `--debug-values`
zapínej jen nad anonymizovaným souborem. Skutečnou fakturu nekopíruj do test
fixtures ani repozitáře.

## Trvalé smazání zůstává ve zpracování

Permanent delete nejprve vytvoří databázový `StoredFileDeletionTask`. Stav
`PENDING` nebo `FAILED` znamená, že dokumentová data už byla transakčně
odstraněna, ale storage worker musí bezpečně dokončit fyzický cleanup. Ověř
zapisovatelnost `UPLOAD_ROOT`, spusť API a sleduj pouze bezpečné chybové kódy.
Neloguj ani ručně nekopíruj `storageKey`. Task má omezený počet pokusů; po jeho
vyčerpání vyžaduje řízenou interní opravu, ne přidání veřejné storage route.

## Dashboard Úkolů vrací neplatný formát

Ověř, že klient volá přesně `GET /api/v1/tasks/dashboard` pouze s volitelným
`timezone`; nepřidávej `view`, `page` ani `pageSize`. Static dashboard controller
musí být v `TasksModule` registrovaný před dynamickou routou `/:taskId`.
Jinak řetězec `dashboard` zachytí UUID pipe detailu a bezpečný globální filter
vrátí `REQUEST_FAILED` a text „Požadavek nemá platný formát.“. Validaci
nevypínej; spusť HTTP test `task-dashboard.http.spec.ts`.

## Dlouhá událost má pouze krátkou barevnou plochu

Nejdříve ověř `startsAt`, `endsAt` a duration segmentu. Pokud positioning
wrapper má správnou výšku, zkontroluj `data-calendar-event-surface` a vnitřní
button: v compact time-grid variantě musí používat `h-full`. Pixelovou výšku
neupravuj v komponentě; zdrojem pravdy je pouze `time-grid.layout.ts`. Regresní
test pro 08:00–20:00 očekává 720 minut a 768 px při současné konfiguraci.

## Našeptávání míst nebo odhad cesty nefunguje

Při `MAPY_API_ENABLED=false` jde o očekávaný stav: ruční místo a event se uloží,
ale route je `UNAVAILABLE`. Při zapnutém provideru ověř pouze názvy proměnných,
ne jejich hodnoty, síťový egress backendu a omezení projektu. Chyby 401/403,
timeout a kredity řeší [Mapy runbook](mapy-api.md). Klíč nikdy neposílej do
browseru, issue, screenshotu nebo URL.

Výchozí místo se nenastavuje z předem naplněného selectu. Do autocomplete
zadej nejméně tři znaky, potvrď konkrétní návrh a potom zvol „Uložit jako
výchozí“. UI odliší prázdný dotaz, loading, nulový výsledek, vypnutého
providera, chybu oprávnění i timeout. Pouhé napsání textu vytvoří nejvýše
MANUAL údaj bez routingu. Změna cíle či předchozího eventu může správně označit
konfiguraci `STALE`; preview ji načte znovu. Neopravuj výpadek posunem
`startsAt`, cache provider response nebo veřejnou Mapy proxy bez session.

## Finance odmítají částku, účet nebo převod

UI přijímá český formát například `1 249,50`, API ale očekává decimal string
minor units. Nepřeváděj chybu přes `parseFloat`; ověř `money.ts` helper a
`amountMinor`. Nový zápis odmítne archivovaný účet/kategorii, neshodnou category
kind nebo měnu. Převod vyžaduje dva rozdílné aktivní účty stejné měny a musí se
měnit/smazat přes `/finance/transfers`, nikdy přes jednu transferovou transakci.
Pokud zůstatek nesedí, porovnej opening balance a nesmazané ledgerové typy;
nepřidávej další persistovaný current-balance sloupec.

## CSV import nerozpozná sloupce nebo hlásí duplicitu

Detekce formátu je návrh. V průvodci zkontroluj kódování, středník/čárku/tab,
řádek hlavičky, datum a oddělovače čísel, potom ručně namapuj datum a částku.
Stejný desetinný a tisícový oddělovač API odmítne. Exact file hash blokuje
opakovaný dokončený import stejného účtu; fingerprint je jen možná duplicita a
vyžaduje explicitní zahrnutí. Opakovaný commit stejné session nesmí vytvořit
další transakce.

Rozpracované CSV je dočasné. Cancel nebo expirace jej odstraní přes storage
port. Pokud cleanup selže, neopravuj stav ručním mazáním aktivního `uploads`;
nejprve ověř oprávnění `UPLOAD_ROOT`, storage log code a znovu spusť omezený
cleanup. Do logu nevypisuj CSV, protistrany ani bankovní symboly.

## Kontroly selhávají kvůli verzi nástrojů

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm check
```

Projekt očekává Node 24 a pnpm 11.12.0. Pokud selže jen formát, spusť
`pnpm format`, zkontroluj diff a opakuj celý `pnpm check`.
