# Úkoly

## Stav

Implementováno. Modul pokrývá jednorázové a opakované úkoly, více účastníků,
odhadovanou délku, místo, kategorie, dokumentové vazby, dokončovací historii,
dashboard a bezpečný veřejný vstup pro plánování. Starý název Agenda a API
`/agenda` již nejsou zdrojem pravdy.

## Účel

Úkoly spravují domácí povinnosti a jejich dokončení. Termín úkolu zůstává
termínem, nikoli rezervovaným blokem času. Naplánovaný čas vlastní kalendář a
obě domény propojuje explicitní `TaskCalendarLink`.

## Uživatelské scénáře

- vytvořit a upravit úkol pro jednoho nebo více aktivních členů domácnosti;
- zadat prioritu, termín bez času nebo s časem, časové pásmo, délku 5 až 1 440
  minut a místo; termín lze také úplně vynechat;
- použít potvrzené uložené místo, ruční text nebo žádné místo;
- dokončit jednorázový úkol nebo posunout opakovaný úkol se zachováním historie;
- otevřít pohledy Vše, Dnes, Nadcházející, Po termínu a Dokončené;
- připojit dokumenty přes veřejné rozhraní Documents modulu;
- otevřít bezpečné plánování, zobrazit propojenou událost, přeplánovat nebo
  odebrat pouze kalendářovou vazbu; smazání task-linked události vždy zachová
  původní úkol a znovu zpřístupní plánování, včetně hromadného calendar delete.

## Uživatelské rozhraní

Feature `features/tasks` používá interní workspace navigaci při stálé URL
`/app`. Uložená stará hodnota `agenda` se při načtení migruje na `tasks`.
Desktop skládá kompaktní seznam a Dialog, mobil samostatné karty a full-screen
Dialog. Účastníci jsou viditelní jako avatary i jména; barva není jediný
nositel informace. Formulář znovu používá veřejný `PlaceAutocomplete` Location
feature a nevolá Mapy.com přímo.
Přístupný český calendar picker má přepínání měsíců a akce Dnes, Bez času a
Vymazat termín. Číselné pole délky doplňují nezávazné presety 30, 60, 90 a 120
minut; vlastní celá hodnota zůstává možná.

## API

Všechny endpointy `/api/v1/tasks` jsou autentizované a mutace podléhají Origin
a CSRF ochraně. API poskytuje list/detail/create/update/complete/reopen/cancel,
archive, kategorie, dashboard a podcestu `:taskId/scheduling`. Chybějící `view`
znamená `all`, tedy všechny `OPEN` úkoly v serverovém prioritním pořadí. Přesný
seznam uvádí [katalog endpointů](../api/endpoints.md).
Dashboard používá jediný statický endpoint `/tasks/dashboard` bez list
stránkování. Statická route je registrovaná před `/:taskId`, takže ji UUID pipe
nemůže zaměnit za detail úkolu; integrační test tento kontrakt chrání.

## Datový model

Prisma model `Task` je nedestruktivně mapovaný na původní fyzickou tabulku
`AgendaTask`. `TaskParticipant` je explicitní many-to-many vazba s unikátní
kombinací task/user; migrace do ní převedla původní `assignedToUserId`.
`TaskCompletion` uchovává historii, `TaskCategory` domácí kategorie a
`TaskDocument` skutečný FK na dokument. `estimatedDurationMinutes` má databázový
limit 5–1 440. Místo je potvrzené FK `locationPlaceId` nebo neroutovatelný
`locationLabel`/`locationNotes`.
Termín tvoří `dueDate` (`DATE`) a volitelný `dueTimeMinutes` (0–1439). `dueAt`
je serverem odvozený instant pouze pro úkol s časem; date-only úkol má `dueAt`
null a nezobrazuje skrytou půlnoc. Bez termínu jsou obě pole null.
`TaskCompletion` stejným způsobem zachovává datum a volitelný čas výskytu.

## Autentizace a oprávnění

`OWNER`, `ADMIN` a `MEMBER` mohou úkoly mutovat a vybírat pouze aktivní členy,
kategorie, dokumenty a místa stejné domácnosti. `VIEWER` pouze čte. Cizí nebo
neexistující entita vrací stejnou bezpečnou chybu. Kalendář ani plánovač
neobcházejí `TasksFacade`.

## Validace a chybové stavy

Název a účastník jsou povinné. Recurrence vyžaduje datum a validuje frekvenci,
interval, dny, měsíc i konec série. Timezone je IANA identifikátor. Účastník,
kategorie, dokument a potvrzené místo musí patřit stejné domácnosti. UI ukončí
loading i při timeoutu a zobrazí bezpečnou českou zprávu.
Date-only úkol je dnešní po celý místní kalendářní den a opožděný až od dalšího
dne. Úkol s časem se stane opožděným po překročení odvozeného `dueAt`; úkol bez
termínu nepatří do Dnes ani Po termínu. Date-only recurrence počítá další
`dueDate` bez půlnočního instantu.

## Testy

Backend používá pevný `ClockPort` pro recurrence, testuje role, household
izolaci, multi-participant zápis, délku, místo, dokumentové vazby a neduplicitní
calendar feed. Calendar lifecycle testuje také zachování úkolu a nastavení
`TaskCalendarLink.removedAt` při smazání linked události. Frontend testuje výchozí Vše, mobilní seznam, formulář,
účastníky, délku, místo, quick complete a scheduling vstupy. Time-grid a
Scheduling mají samostatné čisté a aplikační testy.
Regresní sada pokrývá dashboardový HTTP kontrakt, tři stavy termínu, date-only
today/overdue a recurrence, DST u časovaných úkolů, date picker, rychlé akce a
presety délky včetně vlastní hodnoty 75 minut.

## Známá omezení

- změna recurrence platí pro celou budoucí sérii;
- první verze chytrého plánování přijímá pouze neopakované úkoly;
- drag-and-drop, notifikace a externí kalendářová synchronizace nejsou součástí;
- `assignedToUserId` zůstává dočasně kompatibilní fyzické pole, zdrojem
  účastníků je `TaskParticipant`.

## Budoucí možnosti

Bezpečná podpora konkrétního výskytu recurring úkolu může využít
`TaskCalendarLink.occurrenceDueAt`. Notifikace a Google Calendar vyžadují
samostatný návrh a oprávnění.
