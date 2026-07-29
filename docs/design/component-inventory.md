# Inventář komponent

Komponenty jsou lokální shadcn-style zdrojový kód napojený na Aurora tokeny.
Dialog, sheet, dropdown a tooltip používají Radix primitives. Ikony jsou pouze
z Lucide.

## Používané UI primitives

| Komponenta            | Stav           | Hlavní odpovědnost                                     |
| --------------------- | -------------- | ------------------------------------------------------ |
| BrandMark             | Implementováno | HomeApp značka bez cizího loga                         |
| Button                | Implementováno | Varianty, loading, disabled a 44px target              |
| IconButton            | Implementováno | Povinný přístupný název a čtvercový target             |
| Input                 | Implementováno | Label, hint, error, invalid a disabled stav            |
| Textarea              | Implementováno | Víceřádková metadata s hint/error a disabled stav      |
| Select                | Implementováno | Typy, složky, filtry a velikost stránky                |
| Avatar                | Implementováno | Bezpečný obrázek nebo iniciála                         |
| Badge                 | Implementováno | Neutrální a sémantické štítky s AA kontrastem          |
| Card                  | Implementováno | Sémantický raised surface                              |
| Divider               | Implementováno | Vizuální oddělení                                      |
| EmptyState            | Implementováno | Pravdivý prázdný stav a volitelná akce                 |
| InlineAlert           | Implementováno | Info, success, warning a danger s ikonou               |
| Spinner/LoadingScreen | Implementováno | Přístupný průběh a reduced-motion chování              |
| DropdownMenu          | Implementováno | Klávesové menu, radio items a focus přes Radix         |
| Dialog                | Implementováno | Velikosti sm/md/lg/viewport, full-screen mobile, focus |
| Sheet                 | Implementováno | Pravý nebo spodní panel přes Radix Dialog              |
| Tooltip               | Implementováno | Textový popisek ikonové navigace                       |
| ThemeSelector         | Implementováno | System/light/dark radio group pro menu i mobilní UI    |
| DatePicker            | Implementováno | Český date-only kalendář pro Tasks a Finance           |
| Switch                | Implementováno | Přístupný binární stav s viditelným externím labelem   |

SearchInput, Checkbox, Tabs, Skeleton a samostatná
Separator API nejsou vytvořené, protože je produkční UI zatím nepotřebuje.
Vzniknou až s konkrétní feature a všemi relevantními stavy.

Finance skládá malé overview, account/category panel, transakční desktop/mobile
list, detail, formuláře a potvrzovací Dialog. Peněžní vstup má textový český
formát a sémantické success/danger doplnění textovým znaménkem; barva není
jediný nositel významu. Dashboard widget je samostatný veřejný export a prázdný
stav nepoužívá demo účty ani částky.

Finance import přidává skutečně používaný `CsvImportDropzone`, formát/mapping
ovládání, profil picker, desktopovou tabulku a mobilní preview seznam.
Kategorizace používá rule editor a bulk toolbar. Analytics používá přístupné
horizontální category bars, line trend, textové souhrny a drill-down tlačítka;
light/dark barvy pocházejí pouze ze sémantických Aurora tokenů.
Rozpočty přidávají `BudgetProgress`, `BudgetCategoryLimitField`, adaptivní
`BudgetFormDialog`, category comparison s textovou alternativou,
`SpendingInsightCard`, `RecurringCandidateCard` a kompaktní veřejný dashboard
widget. Překročení, forecast a warning mají vedle barvy vždy text.
Bucket list skládá `BucketListProgressPanel`, toolbar, responzivní karty,
členěný item form, participant/document picker, lifecycle potvrzení,
`BucketListRolloverDialog`, detail a samostatný dashboard widget. Compact
režim nepoužívá tabulku a empty stav nevytváří ukázková přání.

## App shell

`AppShell` jen skládá `DesktopSidebar`, `CollapsedSidebar`,
`TabletNavigationRail`, `MobileHeader`, `MobileBottomNavigation`, `AppTopBar`,
`HouseholdSwitcher`, `HomeBrandButton`, `UserMenu` a `QuickCreateButton`.
Brand je samostatná homepage akce; sbalení/rozbalení má vlastní accessible
target a používá `sidebarPreference`. Theme provider patří do
aplikačních providerů, ne do shellu nebo stránky.

Dokumentový feature skládá oddělené library, folder tree/sheet, dynamické
formuláře, preview, extraction review, detail, action a adaptivní modal
komponenty. `DocumentPreviewDialog`, `DocumentEditDialog`,
`DocumentMoveDialog` a `DocumentLifecycleDialog` používají stejnou Radix focus
infrastrukturu, ale zachovávají jednotlivé odpovědnosti. Permanent delete
dialog vyžaduje textové potvrzení; dirty edit má vlastní potvrzení zahození.
Datové operace vlastní TanStack hooky, ne tyto prezentační komponenty.

Tasks feature skládá `TasksToolbar`, samostatný desktopový řádek a mobilní
kartu, filtry/paginaci, členěný `TaskForm`, adaptivní create/edit/complete/cancel
dialogy, category manager, detail s historií a task dashboard widget. Formulář
obsahuje multi-participant selector, odhad délky a sdílený location picker. Recurrence
výpočty nejsou UI odpovědnost; další termín přichází ze serveru.
Termín dále skládají `TaskDueDatePicker`, `TaskDueDateField` a
`TaskDueQuickActions`; délku doplňuje `TaskDurationPresets`. Calendar picker je
na mobilu full-screen Dialog, na desktopu kompaktní dialog a používá skutečné
button/grid sémantiky a viditelný focus.

Calendar feature skládá toolbar, samostatný month/week/day/list pohled, event
item, adaptivní create/edit dialog, detail, sekundární template manager,
day-selection a `TodayCalendarWidget`. `createCalendarEventDraft`,
`useCreateCalendarEventDialog` a `useCalendarQuickCreate` sjednocují toolbar,
dvojklik, dashboard i globální Add bez druhého formuláře. `CalendarTimeGrid`, `TimeGutter`,
`DayColumn`, `AllDaySection`, `CurrentTimeIndicator`, `CalendarEventBlock`,
`CalendarTravelBlock` a `OverlapEventLayer` skládají skutečnou časovou osu.
`CalendarEventBlock` je positioning wrapper a vnitřní `CalendarEventItem`
surface i ovládací button jej v time-grid variantě vyplňují přes `h-full`.
Šablona se upravuje odděleným formulářem a `CalendarMonthPicker` poskytuje
lokalizovanou mřížku Po–Ne, přepnutí měsíce/roku a vícenásobný výběr. Bulk
picker nikdy není trvale otevřený v hlavním kalendáři. Mobilní měsíc
doplňuje agendu vybraného dne; noční směna zůstává jednou položkou s textovým
`+1 den`. Týdenní grid ji vykresluje jedním souvislým prvkem přes oba dny,
nikoli dvěma samostatně ovladatelnými kopiemi.
`TaskSchedulingDialog`, `SchedulingWindowFields`, `SchedulingCandidateList`,
`SchedulingCandidateCard`, `SchedulingDiagnostics`,
`ParticipantTravelSummary` a `ScheduledTaskSummary` zobrazují serverové návrhy,
diagnostiku a calendar vazbu. Radio group nemá automatický výběr, neověřený
travel slot vyžaduje checkbox potvrzení a confirm je oddělený od suggest
requestu. `CalendarEventDeleteDialog` je adaptivní potvrzení a pro zdroj `TASK`
vysvětluje zachování původního úkolu.
`CalendarEventColorPicker` je radio group s live preview, `EventScheduleFields`
odděluje all-day data a časy a `CalendarSelectionToolbar`,
`CalendarBulkEditDialog` a `CalendarBulkDeleteDialog` obsluhují lokální
selection režim. Měsíční pohled zobrazuje cestu kompaktně, den/týden používá
plný `CalendarTravelBlock`.
Strukturované místo skládá `PlaceAutocomplete`, `PlaceSuggestionList`,
`SelectedPlaceSummary`, `DefaultPlaceAutocomplete` a společná
`MapyAttribution`; odhad zobrazuje `TravelEstimatePreviewList` nebo
`RouteEstimateSummary` s textovým conflict stavem. `EventParticipantSelector`,
`WorkShiftPresetPicker`, `EventLocationFields` a `EventTravelFields` zůstávají
samostatné formulářové sekce, `CalendarTravelBlock` je read-only položka feedu.
Členové používají `MemberCalendarColorPicker` s allowlistem tokenů. Všechny
používají sémantické
Aurora povrchy, warning/danger text i ikonu a 44px target; neobsahují provider
barvy ani hardcoded HEX.

Workspace navigace není UI primitive: Provider, registry, feature hosty,
`WorkspaceLink` a overlay host drží jedinou `/app` URL a interní history.

## Storybook

Stories pokrývají light/dark tokeny, typografii, Button, Input, IconButton,
Badge, Avatar, EmptyState, InlineAlert, Dialog, Sheet, ThemeSelector, tři režimy
AppShellu, LoginPage desktop/mobile a DashboardPage empty light/dark i fixture.
Bucket list stories pokrývají prázdný i naplněný roční seznam, dashboard a
compact/expanded layout.
Story fixture nejsou importované produkčním entrypointem. Build končí v
ignorované složce `apps/web/storybook-static/`.
