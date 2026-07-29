# Roadmapa

Roadmapa vyjadřuje pořadí záměrů, nikoliv existující funkce nebo termínový
závazek. Žádný následující feature celek zatím nebyl uživatelem výslovně
schválen k implementaci.

## Now

- Document Library je dokončená v rozsahu uploadu, logických složek, typových
  metadat/notes, prezentačního seznamu, adaptivních modalů, hledání,
  stránkování, preview/download, archivu, koše a outbox permanent delete.
- Layout-aware PDF extraction V2, supplier profil, line items, confidence a
  explicitní review návrhů faktur jsou implementované bez automatického
  finančního zaúčtování.
- Úkoly jsou dokončené v rozsahu recurrence, kategorií, více účastníků,
  délky/místa, date-only/timed/bez-termínu modelu, dokončovací historie,
  dokumentových vazeb, výchozího Vše a dashboard quick complete. Starý název
  Agenda již není zdrojem pravdy.
- Shared Calendar je dokončený v rozsahu ručních událostí, čtyř směnových
  presetů, event/participant/shared barev, explicitních all-day DATE hranic,
  cílových šablon, selection/bulk update/delete, bulk apply/rollback, task
  feedu, skutečného day/week time-gridu, overlap layoutu, travel bloků a
  dnešního widgetu; sdílená geometrie pokrývá dlouhé i přes-půlnoční eventy.
- Smart Task Scheduling je dokončený pro neopakované úkoly: společná
  dostupnost, participant-specific cesty, podepsané návrhy, revalidace,
  explicitní potvrzení a bezpečné odebrání `TaskCalendarLink`.
- Calendar Places & Travel je dokončený v rozsahu strukturovaných/ručních míst,
  volitelného Mapy Suggest/Geocoding/Routing, default-place autocomplete,
  AUTO/default/custom/previous originu po účastnících, transientního preview,
  odjezdu, konfliktu, travel blocku a layoutových view preferencí. Provider
  výsledky se necachují ani nepersistují.
- Workspace používá pouze `/login` a `/app`; single-household provisioning
  připojuje allowlistované OWNER/MEMBER účty bez invitation systému.
- Finance Ledger Core je dokončený v rozsahu účtů, kategorií, ručních
  příjmů/výdajů, atomických stejnoměnových převodů, dokumentových vazeb,
  zůstatků, období a dashboardu bez napojení na banku.
- CSV import je dokončený v rozsahu mapovacího průvodce, profilů, validace,
  deduplikace, idempotentního commitu, dočasného storage cleanupu a kreditní
  karty. Kategorizace a analytika přidávají prioritní pravidla, hromadné
  zařazení, category/trend/merchant přehledy a drill-down po jednotlivých
  měnách.
- Finance Budgets jsou dokončené pro měsíční/vlastní celkové a kategoriální
  limity, refund-aware čerpání, vysvětlitelný forecast, insighty a analytickou
  evidenci opakovaných plateb.
- Sdílený roční Bucket list je dokončený pro household/year seznam, položky,
  více účastníků, místo, dokumenty, lifecycle, progress, dashboard a explicitní
  rollover bez kopírování dokončovací historie.
- Údržba domácnosti je dokončená v rozsahu plánů, recurrence, omezeného
  generování výskytů, task vazeb, dokončení, přeskočení, přeplánování,
  historie, kategorií, dokumentových a finančních vazeb a dashboardu.
- Recepty, jídelníček a nákup jsou dokončené v rozsahu household receptů,
  Decimal množství, přesného scalingu, date-only týdenního plánu, účastníků,
  potvrzené kopie týdne, nákupního preview/agregace, jednoduchých zásob,
  dashboardu a kalendářního summary.
- Single-VPS staging používá hotové GHCR image, named volumes, idempotentní init
  service, automatickou one-shot migraci, runtime public config a Compose
  secrets. Běžný start i aktualizace jsou `docker compose up -d`; bezpečný
  převod starých bind mountů a kontejnerový backup/restore mají samostatné
  postupy.
- Udržovat bezpečný základ, HomeApp Aurora, vizuální baselines, testy
  a dokumentaci v souladu se skutečným kódem.
- Udržovat shodu system/light/dark komponent a WCAG 2.2 AA při každé UI změně.

## Next

- Samostatná notifikační iterace může navázat na Tasks attention data; e-mail,
  push ani Google Calendar nejsou součástí Tasks modulu.
- Scheduling recurring occurrence, uživatelské pracovní hodiny a volitelný
  preview kandidátů v time-gridu vyžadují samostatnou iteraci.
- Invitation systém a změny rolí až po samostatném bezpečnostním návrhu;
  současný read-only members panel a root konfigurace jsou záměrné.
- Přímé bankovní API a automatické párování faktur až jako
  samostatné finance iterace s provider portem a explicitní privacy policy.
- Off-site backup transport a monitoring/alerting až jako samostatná provozní
  iterace po prvním staging deployi. GHCR workflow je připravené, ale jeho
  skutečný běh a registry visibility je nutné ověřit v GitHub repozitáři.

## Later

- Image OCR provider, další anonymizovaně testované supplier profily, durable
  extraction queue, štítky, fulltext, Office
  preview, importy a verzování pouze jako samostatně schválené iterace.
- Majetek a vozidla jako samostatné feature moduly.
- Drag-and-drop kalendáře, Google Calendar/CalDAV a výpočet pracovní doby pouze
  jako samostatně schválené iterace.
- Veřejná doprava, mapový route náhled, live poloha a turn-by-turn navigace
  pouze jako samostatný privacy/provider návrh.
- Multi-node/high-availability deployment pouze po samostatném kapacitním a
  provozním návrhu.

## Ideas

- Přechod lokální storage na NAS nebo S3 adaptér bez změny aplikační logiky.
- Oddělený consent a token lifecycle pro budoucí Google Calendar integraci.
- Bezpečná správa více aktivních sessions uživatelem.
