# Údržba domácnosti

## Účel a rozsah

Modul Údržba domácnosti eviduje jednorázové i opakované servisní a pečující
činnosti společné domácnosti. Plán odděluje dlouhodobé nastavení od konkrétního
výskytu. Výskyt lze dokončit, přeskočit, přeplánovat nebo propojit s úkolem.
Dokončení uchovává datum, autora, plain-text poznámku, dodavatele, skutečnou
cenu a explicitní vazby na existující dokumenty a finanční transakce.

Modul neobsahuje Majetek, Vozidla, sklad dílů, objednávání dodavatelů ani nový
upload. Primární propojení s kalendářem vede přes Úkoly a současný workflow
úkol → kalendář.

## Uživatelské rozhraní

Interní workspace `maintenance` zůstává pod jedinou viditelnou URL `/app`, ale
v hlavní navigaci je uživatelsky součástí oblasti `Úkoly`. Společná sekundární
navigace přepíná mezi běžnými Úkoly a Údržbou; při libovolném maintenance view
zůstává v shellu aktivní hlavní položka Úkoly. Samostatná hlavní položka
Údržba neexistuje. Na telefonu používá tento přepínač jeden kompaktní select,
na širším layoutu přístupnou tabovou skupinu.

Uvnitř Údržby zůstávají sekce Přehled, Plány, Historie a Kategorie. Přehled
rozlišuje po termínu, dnes, sedm a třicet dní a pozastavené plány. Desktop
zobrazuje karty plánů ve dvou sloupcích, compact layout jeden sloupec bez
horizontální tabulky.

Centrální `MaintenancePlanDialog` používá jak oblast Údržba, tak dashboardový
widget a globální nabídka `Přidat → Nový plán údržby`. Viewer create ovládání
nevidí. Loading, skutečný empty state a API error jsou oddělené.
Dashboardové `Zobrazit údržbu` otevře interní maintenance přehled, takže shell
zvýrazní Úkoly a sekundární navigace Údržbu. Quick create přitom nemění
současný workspace.

Dokončovací dialog znovu používá veřejný document picker a bezpečný finance
transaction summary. API chyba dialog nezavře a nezahodí rozepsané hodnoty.

## Plán a recurrence

`MaintenancePlan` obsahuje date-only `startsOn`, `endsOn` a `nextDueOn`,
prioritu, stav, kategorii, odpovědnou osobu, délku, místo, dodavatele, výchozí
cenu v minor units a nastavení tvorby úkolu.

Sdílený date-only recurrence engine podporuje:

- jednorázový termín;
- každých N dní nebo týdnů a vybrané weekday;
- každý měsíc nebo každých N měsíců;
- každý rok;
- vybrané měsíce;
- den v měsíci a první až pátý nebo poslední weekday.

`FROM_SCHEDULED_DATE` zachovává plánovaný rytmus. `FROM_COMPLETION_DATE`
použije skutečný den dokončení jako nový anchor. Žádná UI hodnota není volný
cron. Date-only hodnoty se nepřevádějí přes lokální nebo implicitní UTC
interpretaci.

Generátor připraví nejvýše nejbližší tři výskyty a zároveň nejvýše 90 dní
dopředu. U staršího aktivního plánu uchová nejbližší předchozí termín jako
opožděný a přidá budoucí termíny v okně. `maintenancePlanId +
originalScheduledFor` je databázově unikátní a `createManyAndReturn` se
`skipDuplicates` chrání souběžné běhy.

In-process worker spouští stejný use case při startu API a poté každých šest
hodin. Aktivního auditního aktéra vybírá jen z aktivních členů s právem zápisu;
plán bez takového člena bezpečně vynechá. Souběžné API instance mohou worker
spustit současně, ale databázová unikátnost výskytu a aktivní task vazby
zabrání duplikátům.

## Lifecycle výskytu

`MaintenanceOccurrence` má stav `SCHEDULED`, `TASK_CREATED`, `COMPLETED`,
`SKIPPED` nebo `CANCELLED`. `originalScheduledFor` se nemění; přeplánování
mění pouze `scheduledFor` a ukládá autora a čas změny.

- dokončení uloží historii, vazby, cenu a posune `nextDueOn`;
- přeskočení zachová důvod a historii, ale není dokončením;
- přeplánování aktualizuje navázaný úkol přes `TasksFacade`;
- pozastavený plán negeneruje nové výskyty ani úkoly;
- archivace zachová veškerou historii.

Jednorázový plán bez dalšího pending výskytu přejde do `COMPLETED`. Obnovení
neprovádí neomezený catch-up.

## Vazba na Úkoly

`MaintenanceTaskLink` je explicitní vazba se skutečnými FK. Úkol vzniká pouze
přes veřejný `TasksFacade`, přebírá název, date-only termín, odpovědnou osobu,
prioritu, délku a textové místo. Aktivní vazbu chrání unikátní index.

Dokončení navázaného úkolu samo nepotvrdí servisní údaje. Uživatel dokončí
záznam údržby samostatně; modul pak idempotentně dokončí stále otevřený úkol.
Detail úkolu načte přes veřejný maintenance kontrakt bezpečný kontext plánu a
po splnění nabídne `Dokončit záznam údržby`. Akce otevře konkrétní plán v
interním workspace pod aktivní hlavní oblastí Úkoly a bez změny URL. Při
přeskočení se task zruší přes stejnou veřejnou hranici. Sdružená navigace
nemění vlastnictví dat: plány, výskyty, historie, náklady ani dokumenty se
nemapují na běžné řádky úkolů.

## Dokumenty a finance

`MaintenanceOccurrenceDocument` a `MaintenanceOccurrenceTransaction` jsou
samostatné join tabulky, nikoli polymorfní vazba. Dokumenty se validují přes
`DocumentsFacade`; finance přes omezený `FinanceLedgerFacade` summary. Modul
nečte storage key, raw bankovní import, fingerprint ani čísla účtů.

Cena je nezáporný `BigInt` v minor units a ISO měna je povinná současně s
částkou. Dashboard ani historie automaticky nesčítají různé měny.

## Kategorie

Kategorie patří domácnosti a mají normalizovaný název, serverem validovaný
Aurora color token, icon key, pořadí a archivaci. Doporučené kategorie se
zakládají pouze explicitní idempotentní akcí správce.

## Oprávnění a izolace

| Operace                              | OWNER/ADMIN | MEMBER | VIEWER |
| ------------------------------------ | ----------- | ------ | ------ |
| čtení plánů, historie a dashboardu   | ano         | ano    | ano    |
| vytvoření a běžná úprava plánu       | ano         | ano    | ne     |
| dokončení, skip, reschedule, vazby   | ano         | ano    | ne     |
| správa kategorií a archivace/restore | ano         | ne     | ne     |

Každý use case odvozuje domácnost přes `HouseholdAccessService`. Cizí a
neexistující plán, výskyt, kategorie, dokument nebo transakce používá stejnou
bezpečnou odpověď. Všechny endpointy jsou autentizované a mutace podléhají
Origin/CSRF ochraně.

## Dashboard

`GET /api/v1/maintenance/dashboard` vrací jen počty, nejbližší položky,
poslední dokončení, oprávnění a interní navigation target. Dashboard neimportuje
repository ani Prisma a neskládá datumovou logiku v Reactu.

## Testy

Backend testuje recurrence, 90denní/3výskytové okno, roli, public facade
hranice, minor units a task orchestration. Deny-by-default HTTP test pokrývá
anonymní list, create a dashboard. Frontend testuje date-only formátování,
každé tři měsíce, mobilní kartu bez tabulky, skutečný dashboard/empty state,
viewer režim a validovaný workspace stav. Storybook, Playwright a axe pokrývají
přehled, plány, prázdný stav, detail, historii, dashboard widget, globální
`Přidat` a create/complete/skip/reschedule dialogy v compact i desktop
kompozici a light/dark motivu. Navigační regrese navíc ověřují, že hlavní
desktopové ani mobilní menu neobsahuje samostatnou Údržbu, Maintenance aktivuje
Úkoly, sekundární přepínač je použitelný a Back/Forward i reload zachovají
validovaný maintenance view pod `/app`.

## Známá omezení

- Generování probíhá při vytvoření, obnovení, dokončení a v šestihodinovém
  in-process workeru. Samostatný distribuovaný scheduler zatím není zaveden;
  správnost souběhu zajišťuje databáze.
- Editace definice recurrence nemigruje již existující jednotlivé výskyty;
  změna se použije pro další generování.
- Kategorie lze v UI vytvořit, upravit i archivovat; doporučená sada vzniká
  pouze po explicitním potvrzení.
- Dokončení navázaného úkolu probíhá přes veřejný `TasksFacade` ve stejné
  databázové transakci jako záznam dokončení údržby.
- Notifikační centrum, e-mail a push nejsou součástí modulu.

## Budoucí rozšíření

Veřejný `MaintenanceFacade` poskytuje bezpečné ověření plánu a výskytu pro
budoucí Majetek nebo Vozidla bez přístupu k persistence vrstvě. Konkrétní FK
vazby budou přidány až spolu s těmito moduly.
