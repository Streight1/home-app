# Mapa obrazovek

## Veřejná část

### `/login`

- compact: centrovaný raised surface na jemném Aurora pozadí;
- expanded: vlastní HomeApp hero s jemným aurora efektem a login surface;
- oficiální GIS button container, loading, chyba skriptu a bezpečnostní text;
- přihlášený uživatel je přesměrován na `/app`.
- aktivní motiv odpovídá system/light/dark preferenci bez reloadu.

## Přihlášená část

### `/app`

- responzivní AppShell podle tří režimů;
- aktivní domácnost, user menu, logout a připravené search/quick-create affordance;
- attention-first dashboard s pravdivými Tasks a Calendar daty;
- desktop sidebar: Přehled, Dokumenty, Úkoly, Finance, Majetek, Vozidla, Kalendář,
  Jídelníček, Nastavení;
- mobilní bottom navigation: Přehled, Finance, Úkoly, Dokumenty, Více.
- theme selector je v user menu a v mobilním sheetu Více;
- všechny následující obrazovky jsou interní workspace views se stále stejnou
  browserovou URL `/app`; Back/Forward používá bezpečný history state.

### Interní Dokumenty — seznam

- složky, hledání, typ/stav/řazení, stránkování a pravdivý empty state;
- compact kartový seznam a folder sheet; medium/expanded tabulka a folder tree;
- dokumentová navigace je aktivní v bottom navigation, railu i sidebaru.

### Interní Dokumenty — nový dokument

- file picker na všech zařízeních, doplňkový drag-and-drop a bezpečný přehled
  vybraného souboru;
- název z filename, složka, typ, datum, dynamická metadata, notes a validace;
- role `VIEWER` formulář nevidí a backend mutaci nezávisle odmítá.

### Interní Dokumenty — detail

- název, popis, notes, typová metadata, složka, stav, soubor, datum a autor;
- preview/download pro všechny členy; update, move a stav od role `MEMBER`;
- jeden sloupec na mobilu, dvousloupcový detail s action panelem na desktopu.

### Interní Dokumenty — preview overlay

- autentizovaný Blob náhled PDF/JPEG/PNG/TXT a download fallback pro Office;
- mobilní i desktopový viewport bez veřejné URL souboru.

### Interní Dokumenty — extraction review

- PDF text-layer job a review návrhů faktury/účtenky;
- desktop preview/pole vedle sebe, mobilní přepínač Náhled/Pole;
- přijmout, editovat nebo odmítnout; image OCR se nepředstírá.

### Interní Úkoly — seznam

- výchozí Vše, dále Dnes, Nadcházející, Po termínu a Dokončené;
- rychlé a plné vytvoření, více účastníků, délka, místo, kategorie, recurrence a
  dokumentový picker;
- compact mobilní karty a full-screen formulář, desktopový kompaktní seznam a Dialog.

### Interní Úkoly — detail úkolu

- stav, termín, priorita, recurrence, účastníci, délka/místo a bezpečné
  dokumentové souhrny;
- historie dokončených výskytů se jménem, časem, původním termínem a poznámkou.
- akce Naplánovat otevře adaptivní plánovací Dialog; radio návrh není vybraný
  automaticky a linked summary odděluje event od životního cyklu úkolu.

### Interní Kalendář

- výchozí Měsíc, dále Týden, Den a Seznam;
- compact měsíc se seznamem vybraného dne; Den a Týden používají skutečnou
  vertikální osu s overlap layoutem, nočními segmenty a travel bloky;
- ruční event, denní/noční směna, účastníci, šablony v sekundárním dialogu;
- detail eventu, editace, zrušení a smazání; Task termín naviguje do Úkolů;
- TodayCalendarWidget na dashboardu zobrazuje probíhající a dnešní události.

### Interní Finance

- Přehled zobrazuje skutečné zůstatky účtů, příjmy, výdaje a poslední ruční
  transakce bez demo částek;
- Transakce podporují filtrování, stránkování, detail, dokumentové vazby a
  adaptivní formuláře příjmu, výdaje a stejnoměnového převodu;
- Účty a Kategorie mají samostatné compact/expanded pohledy s role-based
  akcemi; částky se zadávají jako desetinný text a přesně převádějí na minor
  units.

### Interní Nastavení

- theme selector;
- read-only členové sdílené domácnosti bez invitation akcí.

## Přechodové stavy

- ověřování session používá `LoadingScreen` a chráněný obsah se nevykreslí;
- 401 přesměruje na login;
- chyba načtení session zobrazí bezpečnou českou zprávu;
- logout revokuje session a po úspěchu přesměruje na login.

## Neexistující obrazovky

Neexistují business stránky majetku, vozidel ani jídelníčku. Jejich navigační
položky jsou disabled a označené jako připravované.
Dokumenty zatím nemají štítky, image OCR, Office preview ani verzování. Neexistuje
automatické přeplánování ani scheduling recurring occurrence. Neexistuje
`/design-preview` ani jiná produkční galerie designu.
