# API endpointy

Globální guard používá `AUTHENTICATED`; CORS není autentizace. Mutace navíc
vyžadují přesný Origin a CSRF cookie/header. Cizí household entity se neprozradí.

## Public

### `POST /api/v1/auth/google`

Jediná anonymní aplikační výjimka. Přijímá JSON Google credential, kontroluje
Origin/rate limit, serverově ověří ID token a allowlist, vytvoří nebo aktualizuje
uživatele a vydá HttpOnly session plus čitelnou CSRF cookie. Úspěch `200`.

## Authenticated

### Autentizace

- `GET /api/v1/auth/me` — bezpečný profil a aktivní domácnost; bez session 401.
- `POST /api/v1/auth/logout` — revokace session v PostgreSQL, CSRF, úspěch 204.

### Domácnost

- `GET /api/v1/household/members` — aktivní členové serverem odvozené
  domácnosti; vrací pouze bezpečný profil a roli, nikdy Google subject nebo
  session data.

### Dokumentové typy

- `GET /api/v1/document-types` — read-only verzovaný registr typů, českých
  labelů, datových typů a povolených polí; minimální role `VIEWER`.

### Složky dokumentů

- `GET /api/v1/document-folders` — celý strom aktivní domácnosti;
- `POST /api/v1/document-folders` — vytvoření `{name,parentId}`;
- `PATCH /api/v1/document-folders/:folderId` — přejmenování;
- `POST /api/v1/document-folders/:folderId/move` — nový `parentId` nebo kořen;
- `DELETE /api/v1/document-folders/:folderId` — pouze prázdná složka.

Čtení je od role `VIEWER`; mutace od `MEMBER`. Server vynucuje household,
unikátní normalizovaný název mezi sourozenci, hloubku 10 a zákaz cyklů.

### Dokumentová knihovna

- `POST /api/v1/documents` — multipart `file`, `title`, volitelný `description`,
  `notes`, `documentType`, `folderId`, `documentDate` a JSON `metadata`; `201`;
- `GET /api/v1/documents` — serverový seznam;
- `GET /api/v1/documents/:documentId` — bezpečný detail;
- `PATCH /api/v1/documents/:documentId` — základní a typová metadata;
- `POST /api/v1/documents/:documentId/move` — složka UUID nebo `null`;
- `POST /api/v1/documents/:documentId/archive` — stav `ARCHIVED`;
- `POST /api/v1/documents/:documentId/restore` — obnova z archivu do `ACTIVE`;
- `POST /api/v1/documents/:documentId/trash` — přesun do stavu `TRASHED` bez
  odstranění souboru;
- `POST /api/v1/documents/:documentId/restore-from-trash` — původní složka,
  nebo kořen, pokud už neexistuje;
- `DELETE /api/v1/documents/:documentId/permanent` — pouze `TRASHED`, role
  `ADMIN`/`OWNER`, vytvoří interní storage deletion task, úspěch `204`;
- `GET /api/v1/documents/trash` — samostatně stránkovaný obsah koše.

Seznam podporuje `page`, `pageSize` pouze 10/20/50/100 (výchozí 20), `query`,
`folderId` (`root` pro dokumenty bez složky), `includeSubfolders`, `type`,
`status`, `createdFrom`, `createdTo`, `sortBy` (`createdAt`, `updatedAt`, `title`,
`documentDate`, `fileSize`) a `sortDirection`. Odpověď je
`{items,pagination:{page,pageSize,totalItems,totalPages}}`.

Role `VIEWER` smí pouze číst. Upload/update/move/archive/trash/restore vyžadují
`MEMBER`. Permanent delete vyžaduje `ADMIN`. Běžná položka seznamu obsahuje
serverový `presentation` model a permissions; frontend nemusí interpretovat
typová JSON metadata. Veřejné DTO nikdy neobsahuje `storageKey`, checksum,
deletion task ani filesystem cestu.

### Dokumentové soubory

- `GET /api/v1/documents/:documentId/file/preview` — inline PDF/JPEG/PNG/TXT;
- `GET /api/v1/documents/:documentId/file/download` — vždy attachment;
- `GET /api/v1/documents/:documentId/file` — kompatibilní attachment alias.

Všechny streamují výhradně přes `StoragePort`, nastavují bezpečný
`Content-Type`, `Content-Length`, sanitizovaný `Content-Disposition`,
`X-Content-Type-Options: nosniff` a `Cache-Control: private, no-store`. Office
preview vrací bezpečnou nepodporovanou odpověď; nevzniká veřejná redirect URL.

### Vytěžování dokumentů

- `POST /api/v1/documents/:documentId/extractions` — vytvoří job a vrátí `202`;
- `POST /api/v1/documents/:documentId/extractions/:jobId/retry` — nový job,
  `202`;
- `GET /api/v1/documents/:documentId/extractions/:jobId` — stav a kandidáti;
- `PATCH /api/v1/documents/:documentId/extractions/:jobId/fields/:candidateId`
  — status `ACCEPTED`, `EDITED` nebo `REJECTED`, případně editovaná hodnota;
- `POST /api/v1/documents/:documentId/extractions/:jobId/accept-safe` — přijme
  dosud navržená pole s confidence alespoň 0,85, pokud stejné pole ještě nemá
  ručně potvrzenou hodnotu; konflikt vyžaduje individuální review.

Start/retry/review vyžadují `MEMBER`; čtení jobu `VIEWER`. Endpoint negeneruje
OCR výsledek synchronně a přijaté hodnoty se validují aktuálním schématem typu.
Kandidát obsahuje důvody confidence a zdrojovou oblast stránky. Image/scanned
OCR bez provideru končí `OCR_NOT_CONFIGURED`.

### Úkoly a plánování

- `POST /api/v1/tasks` — vytvoření úkolu;
- `GET /api/v1/tasks` — stránkovaný a filtrovaný seznam;
- `GET /api/v1/tasks/:taskId` — detail včetně dokončovací historie;
- `PATCH /api/v1/tasks/:taskId` — úprava budoucího nastavení úkolu;
- `POST /api/v1/tasks/:taskId/complete` — dokončení výskytu;
- `POST /api/v1/tasks/:taskId/reopen` — znovuotevření jednorázového úkolu;
- `POST /api/v1/tasks/:taskId/cancel` — zrušení;
- `POST /api/v1/tasks/:taskId/archive` — archivace;
- `GET /api/v1/tasks/categories` — kategorie domácnosti;
- `POST /api/v1/tasks/categories` — vytvoření kategorie;
- `PATCH /api/v1/tasks/categories/:categoryId` — název nebo povolený color token;
- `DELETE /api/v1/tasks/categories/:categoryId` — odstranění kategorie bez úkolů;
- `GET /api/v1/tasks/attention` — kompatibilní omezený attention souhrn;
- `GET /api/v1/tasks/dashboard` — bezpečný dashboard model se summary a
  maximálně sedmi prioritními položkami pro quick complete; přijímá pouze
  volitelný IANA parametr `timezone`, nikoli list `page`, `pageSize` nebo `view`;
- `POST /api/v1/tasks/:taskId/scheduling/suggestions` — nejvýše pět
  podepsaných návrhů bez zápisu do kalendáře; body podporuje
  `considerTravel` a response přidává bezpečnou agregovanou `diagnostics` s
  volnými intervaly a počty důvodů odmítnutí;
- `POST /api/v1/tasks/:taskId/scheduling/confirm` — revalidace a explicitní
  vytvoření `TASK` události a `TaskCalendarLink`;
- `DELETE /api/v1/tasks/:taskId/scheduling` — zrušení linked eventu a vazby,
  nikoli samotného úkolu.

Seznam podporuje `view` (`today`, `upcoming`, `overdue`, `all`, `completed`,
`cancelled`, `archived`), `page`, `pageSize` 10/20/50/100, `query`, `status`,
`priority`, `participantUserId`, `categoryId`, `dueFrom`, `dueTo`, `sortBy` a
`sortDirection`. Výchozí řazení závisí na view. Časy jsou ISO instanty a query
obsahuje IANA `timezone` pro správné hranice dne.

Create/update používá `dueDate` jako ISO datum `YYYY-MM-DD` a volitelné
`dueTimeMinutes` 0–1439. Bez data jsou obě hodnoty null. Date-only termín má
čas null a API vrací `dueAt: null`; u termínu s časem backend bezpečně odvodí
`dueAt` z data, minut a IANA timezone. Klient neposílá ani neodvozuje půlnoční
instant.

Bez `view` je bezpečný default `all`: pouze všechny OPEN úkoly včetně
opožděných, dnešních, budoucích a bez termínu. Výchozí serverové řazení dává
přednost opožděným, urgentním/vysokým, dnešním, budoucím a nakonec bez termínu;
React je nepřerovnává.

`VIEWER` pouze čte. `MEMBER` a vyšší mutují úkoly a scheduling; správu kategorií
má `ADMIN`/`OWNER`. Při recurring dokončení server vytvoří `TaskCompletion`, ponechá
task `OPEN` a posune termín; po konci série jej dokončí. Document response
obsahuje jen bezpečný souhrn z `DocumentsFacade`.

Scheduling token je HMAC podepsaný a krátkodobý. Nese také volbu
`considerTravel`; neověřitelná cesta vrací výslovný `TRAVEL_NOT_VERIFIED`,
nikoli prázdný výsledek. Confirm znovu načte původní
časové okno a odmítne změněný task nebo kalendář kódem
`SCHEDULING_SLOT_CHANGED`. Candidate response neobsahuje adresy, Mapy payload
ani provider key. První verze plánuje jen neopakované úkoly.

### Kalendář

- `GET /api/v1/calendar/events` — ruční události v rozsahu;
- `POST /api/v1/calendar/events` — vytvoření události nebo jedné směny;
- `GET /api/v1/calendar/events/:eventId` — bezpečný detail;
- `PATCH /api/v1/calendar/events/:eventId` — úprava a odpojení od batch revert;
- `POST /api/v1/calendar/events/:eventId/cancel` — stav `CANCELLED`;
- `DELETE /api/v1/calendar/events/:eventId` — idempotentní soft-delete události;
  u zdroje `TASK` zachová Task, označí `TaskCalendarLink.removedAt` a dovolí
  nové naplánování;
- `POST /api/v1/calendar/events/bulk-preview` — dopad nejvýše 200 událostí;
- `PATCH /api/v1/calendar/events/bulk-update` — atomicky změní jen explicitně
  označená pole;
- `POST /api/v1/calendar/events/bulk-delete` — po potvrzení `SMAZAT` atomicky
  soft-delete celý výběr, zachová Tasks/Templates a uzavře task linky;
- `GET /api/v1/calendar/feed` — agregace ručních eventů a read-only Task termínů;
- `GET /api/v1/calendar/dashboard` — dnešní/probíhající bezpečný model;
- `POST /api/v1/calendar/travel-estimate` — transientní, rate-limited odhad pro
  všechny zvolené účastníky; nic neukládá a nevrací raw provider odpověď;
- `GET /api/v1/calendar/templates` — šablony domácnosti;
- `POST /api/v1/calendar/templates` — vytvoření šablony;
- `PUT /api/v1/calendar/templates/:templateId` — úprava šablony;
- `DELETE /api/v1/calendar/templates/:templateId` — odstranění šablony bez
  smazání již vytvořených eventů nebo historických batch;
- `POST /api/v1/calendar/templates/:templateId/apply` — použití na jeden den;
- `POST /api/v1/calendar/templates/:templateId/bulk-apply` — transakční použití
  na více lokálních dní;
- `POST /api/v1/calendar/templates/batches/:batchId/revert` — bezpečný rollback
  připojených nezměněných eventů; jednotlivé již soft-deleted události přeskočí
  a neobnoví;
- `GET /api/v1/calendar/events/:eventId/travel-plans` — bezpečné cestovní plány
  účastníků bez input hash a souřadnic;
- `PUT /api/v1/calendar/events/:eventId/travel-plans/:travelerUserId` — uloží
  explicitní origin/route/buffer konfiguraci a odděleně spustí odhad;
- `POST /api/v1/calendar/events/:eventId/travel-plans/:travelerUserId/recalculate`
  — zopakuje odhad bez změny eventu;
- `GET /api/v1/calendar/events/:eventId/travel-origin-candidates` — poslední
  vhodné strukturované eventy daného účastníka pro explicitní volbu.

Všechny cesty jsou autentizované. `VIEWER` čte; `MEMBER`, `ADMIN` a `OWNER`
mutují. Server ověřuje aktivní účastníky stejné household, IANA timezone,
u časované události `endsAt > startsAt`, u celodenní události exkluzivní DATE
hranice, povolený color token a u WORK_SHIFT právě jednoho člena.
Jarní neexistující template čas odmítne; podzimní dvojznačný čas volí dřívější
offset. Feed nic nekopíruje do databáze a veřejné DTO neobsahuje Prisma entity.
Nová událost má `calculateTravel=true`; bez routovatelného cíle se pouze uloží
bez odhadu. AUTO počátek se vyhodnocuje na serveru zvlášť pro každého účastníka.
Šablona smí obsahovat cíl, route mode a rezervu, nikdy konkrétní origin place,
previous event ani route výsledek.

### Místa a kalendářové preference

- `GET /api/v1/locations/suggest?query=...&types=...` — rate-limited Suggest
  proxy; min query, allowlist typů a bezpečný provider mapper;
- `GET /api/v1/locations/places` — PRIVATE místa aktuálního uživatele a
  HOUSEHOLD místa aktivní domácnosti;
- `POST /api/v1/locations/places` — uloží ověřené Mapy nebo ruční místo;
- `GET /api/v1/calendar/preferences` — user/household preference včetně tří
  layoutových calendar view;
- `PATCH /api/v1/calendar/preferences` — změní jen preference aktuálního
  uživatele, default place musí být viditelné.
- `PATCH /api/v1/household/members/:userId/calendar-color` — změní vlastní
  kalendářovou barvu; `OWNER`/`ADMIN` smí podle household policy změnit i jiného
  člena. Přijímá pouze Aurora token allowlist.

Všechny endpointy jsou autentizované; mutace vyžadují Origin a CSRF. Mapy klíč,
provider raw payload, cizí PRIVATE místo a interní souřadnice se nikdy
nevracejí. Suggest, Geocoding ani Routing odpověď se nepersistuje a necachuje.
Ruční místo lze uložit, ale routing vrátí bezpečný `UNAVAILABLE` stav.

### Sdílený roční Bucket list

- `GET /api/v1/bucket-lists?year=2026` — seznam roku včetně filtrovaných
  položek a progress;
- `POST /api/v1/bucket-lists` — založení jediného seznamu domácnosti pro rok;
- `GET /api/v1/bucket-lists/dashboard` — current-year dashboard model;
- `GET /api/v1/bucket-lists/:listId` — detail ročního seznamu;
- `PATCH /api/v1/bucket-lists/:listId` — title, description nebo stav;
- `POST /api/v1/bucket-lists/:listId/close` a `/archive` — lifecycle seznamu;
- `GET /api/v1/bucket-lists/:listId/items` — položky s filtry;
- `POST /api/v1/bucket-lists/:listId/items` — vytvoření položky;
- `GET /api/v1/bucket-lists/summary?year=2026` — počty a procento postupu;
- `POST /api/v1/bucket-lists/:listId/rollover/prepare` — kandidáti pro další
  rok;
- `POST /api/v1/bucket-lists/:listId/rollover/carry` — atomický explicitní
  převod;
- `GET/PATCH/DELETE /api/v1/bucket-list-items/:itemId` — detail, úprava a
  potvrzené odstranění;
- `POST /api/v1/bucket-list-items/:itemId/complete|reopen|skip|restore` —
  lifecycle položky;
- `PUT /api/v1/bucket-list-items/:itemId/participants` a `/documents` —
  atomické nahrazení explicitních vazeb.

List podporuje `status`, `category`, `participantUserId`, `query`, `sortBy` a
`sortDirection`. Cílové i dokončovací datum je ISO datum bez času. `VIEWER`
čte, `MEMBER` a vyšší mutuje. Účastníci, místo a dokumenty jsou vždy ověřené ve
stejné domácnosti přes veřejná modulová rozhraní. Response neobsahuje Prisma
entity, raw metadata dokumentu ani provider data místa.

### Finance

Účty:

- `GET /api/v1/finance/accounts` — aktivní účty, volitelně
  `includeArchived=true`, včetně serverem odvozeného zůstatku;
- `POST /api/v1/finance/accounts` — nový účet; ADMIN/OWNER;
- `GET /api/v1/finance/accounts/:accountId` — bezpečný detail;
- `PATCH /api/v1/finance/accounts/:accountId` — úprava účtu; měna účtu s
  transakcemi se nemění;
- `POST /api/v1/finance/accounts/:accountId/archive` — archivace;
- `POST /api/v1/finance/accounts/:accountId/restore` — obnova.

Kategorie:

- `GET /api/v1/finance/categories` — household strom, volitelně archiv;
- `POST /api/v1/finance/categories` — vlastní kategorie;
- `PATCH /api/v1/finance/categories/:categoryId` — úprava při maximální hloubce
  dvou úrovní;
- `POST /api/v1/finance/categories/:categoryId/archive` — archivace bez smazání
  historických transakcí;
- `POST /api/v1/finance/categories/recommended` — explicitní idempotentní
  vytvoření doporučené sady.

Transakce a převody:

- `GET /api/v1/finance/transactions` — stránkovaný ledger;
- `POST /api/v1/finance/transactions/expense` — ruční výdaj;
- `POST /api/v1/finance/transactions/income` — ruční příjem;
- `GET /api/v1/finance/transactions/:transactionId` — detail;
- `PATCH /api/v1/finance/transactions/:transactionId` — úprava ručního
  příjmu/výdaje;
- `DELETE /api/v1/finance/transactions/:transactionId` — potvrzený soft-delete,
  `204`; transferovou polovinu nelze smazat samostatně;
- `PUT /api/v1/finance/transactions/:transactionId/documents` — nahradí
  explicitní document vazby po ověření přes `DocumentsFacade`;
- `POST /api/v1/finance/transfers` — atomicky vytvoří transfer a dva ledgerové
  zápisy stejné měny;
- `PATCH /api/v1/finance/transfers/:transferId` — atomicky upraví obě strany;
- `DELETE /api/v1/finance/transfers/:transferId` — atomicky soft-delete obou
  stran, `204`.

Seznam přijímá `page`, `pageSize` 10/20/50/100, `query`, `accountId`,
`categoryId`, `type`, `dateFrom`, `dateTo`, `amountFromMinor`,
`amountToMinor`, `documentLinked`, `sortBy` a `sortDirection`. Výchozí je
`bookedDate desc`, stránka 1 a 20 položek. Money vstupy a výstupy jsou decimal
string minor units, nikdy JSON `BigInt` nebo float.

Reporting:

- `GET /api/v1/finance/summary` — `dateFrom`/`dateTo`, zůstatky a oddělené
  currency souhrny příjmů, výdajů, net, nezařazených výdajů a top kategorií;
- `GET /api/v1/finance/dashboard` — omezený veřejný model widgetu a navigation
  target bez repository/Prisma dat.

CSV importy:

- `POST /api/v1/finance/imports` — založí dočasnou multipart CSV session;
- `GET /api/v1/finance/imports` a `GET /api/v1/finance/imports/:importId` —
  historie a bezpečný detail bez storage klíče nebo raw CSV;
- `PATCH /api/v1/finance/imports/:importId/format` — potvrdí encoding,
  delimiter, hlavičku, datum a číselný formát;
- `PATCH /api/v1/finance/imports/:importId/mapping` — normalizuje řádky,
  aplikuje pravidla kategorizace a připraví deduplikované preview;
- `GET /api/v1/finance/imports/:importId/preview` — stránkované řádky
  10/20/50/100;
- `PATCH /api/v1/finance/imports/:importId/rows/:rowId` a
  `PATCH /api/v1/finance/imports/:importId/rows` — zahrnutí, kategorie a
  kontrolovaný transfer review;
- `POST /api/v1/finance/imports/:importId/commit` — idempotentní potvrzení;
- `POST /api/v1/finance/imports/:importId/cancel` — zruší session a uklidí CSV;
- `GET|POST /api/v1/finance/import-profiles` a
  `PATCH|DELETE /api/v1/finance/import-profiles/:profileId` — household
  mapovací profily.

Kategorizace a analytika:

- `GET|POST /api/v1/finance/categorization-rules` a
  `PATCH|DELETE /api/v1/finance/categorization-rules/:ruleId` — prioritní
  pravidla bez uživatelských regulárních výrazů;
- `POST /api/v1/finance/categorization-rules/bulk-apply` — hromadná kategorie
  výdajů/refundů aktuální domácnosti;
- `GET /api/v1/finance/analytics/summary`;
- `GET /api/v1/finance/analytics/category-breakdown`;
- `GET /api/v1/finance/analytics/monthly-trend`;
- `GET /api/v1/finance/analytics/top-merchants`;
- `GET /api/v1/finance/analytics/category-comparison`;
- `GET /api/v1/finance/analytics/dashboard` — omezený dashboard model.

Rozpočty a zjištění:

- `GET|POST /api/v1/finance/budgets` — seznam a vytvoření rozpočtu;
- `GET|PATCH /api/v1/finance/budgets/:budgetId` — detail a bezpečná úprava;
- `POST /api/v1/finance/budgets/:budgetId/archive` — archivace bez smazání;
- `POST /api/v1/finance/budgets/:budgetId/copy` — DRAFT kopie limitů do
  cílového měsíce bez čerpání;
- `GET /api/v1/finance/budgets/:budgetId/summary` — čerpání, refundace,
  zbývající částka, forecast a kategoriální stavy;
- `GET /api/v1/finance/budgets/dashboard` — kompaktní current-period model;
- `GET /api/v1/finance/insights` a `POST /api/v1/finance/insights/refresh` —
  bezpečná zjištění a jejich omezené přepočítání;
- `POST /api/v1/finance/insights/:insightId/acknowledge` a `.../dismiss` — stav
  zjištění;
- `GET /api/v1/finance/recurring-candidates` a confirm/dismiss kandidáta;
- `GET /api/v1/finance/recurring-expenses`, `PATCH .../:id` a
  `POST .../:id/archive` — potvrzená analytická evidence.

Analytické endpointy přijímají období, účty, kategorie, měnu a volbu kreditních
karet. Transfery se neagregují, refund výdaj snižuje a měny se nesčítají.

VIEWER pouze čte, MEMBER a vyšší mutuje ruční transakce a převody,
ADMIN/OWNER spravuje účty a kategorie. Vše je household scoped; archivované
entity zůstávají v historii, ale nelze je použít pro nový zápis. CZK a EUR se
agregují odděleně bez konverze.

## Internal

Interní endpointy nejsou pod `/api/v1`, nepřijímají běžnou session a vyžadují
timing-safe porovnanou hlavičku `X-Internal-Health-Token`.

- `GET /internal/health/live` — proces běží; bez tokenu 401.
- `GET /internal/health/ready` — bezpečný PostgreSQL dotaz; bez tokenu 401,
  nedostupná databáze 503.

Swagger není registrován ani veřejně vystaven.
