# Funkční moduly

Tato složka dokumentuje pouze skutečně implementované aplikační oblasti. Každý
feature dokument propojuje uživatelské chování, UI, API, data, oprávnění a testy.
Plánované oblasti patří do [roadmapy](../roadmap.md), nikoli do prázdných feature
dokumentů.

## Implementované moduly

- [Autentizace](authentication.md) — Google Identity Services, serverové relace,
  chráněné routy a odhlášení.
- [Dokumenty](documents.md) — bezpečná knihovna se složkami, typovými metadaty,
  prezentačním seznamem, modály, košem, outbox mazáním a auditem.
- [Vytěžování dat](document-extraction.md) — layout-aware PDF pipeline, invoice
  strategie, line items, confidence a explicitní review bez automatického
  přepisování metadat.
- [Úkoly](tasks.md) — jednorázové a opakované úkoly, více účastníků, místo,
  délka, historie dokončení, dokumentové vazby a dashboardový widget.
- [Plánování úkolů](task-scheduling.md) — návrhy společných volných slotů,
  participant-specific cesty, explicitní potvrzení a vazba na kalendář.
- [Kalendář](calendar.md) — sdílené události, denní/noční směny, účastníci,
  šablony, transakční bulk apply, feed úkolů a dnešní widget.
- [Místa a plánování cesty](locations-and-travel.md) — strukturovaná místa,
  Mapy.com provider porty, odhad cesty, konflikty a layoutové view preference.
- [Workspace navigace](workspace-navigation.md) — jediná `/app` URL, bezpečný
  interní stav, Back/Forward, reload a overlay historie.
- [Členové sdílené domácnosti](household-members.md) — single-household
  bootstrap, OWNER/MEMBER admission a read-only seznam členů.
- [Finance](finance.md) — přesný ruční household ledger s účty, kategoriemi,
  příjmy/výdaji, atomickými převody, dokumenty a reportingem po měnách.
- [Finance importy](finance-imports.md) — bezpečný CSV průvodce, uložené
  profily, validace řádků, deduplikace a kreditní karty.
- [Kategorizace financí](finance-categorization.md) — normalizace obchodníků,
  prioritní pravidla a hromadné zařazování.
- [Finanční analytika](finance-analytics.md) — oddělené měnové agregace,
  kategorie, trend, obchodníci a drill-down bez převodů.
- [Finanční rozpočty](finance-budgets.md) — celkové a kategoriální limity,
  čerpání, refundace, forecast a kopírování období.
- [Zjištění o výdajích](spending-insights.md) — vysvětlitelné rozpočtové a
  trendové odchylky s bezpečným drill-downem.
- [Opakované výdaje](recurring-expenses.md) — detekované kandidáty a ručně
  potvrzená analytická evidence pravidelných plateb.
- [Sdílený roční Bucket list](bucket-list.md) — household přání po letech,
  účastníci, dokumenty, dokončovací historie, progress a explicitní rollover.
- [Údržba domácnosti](maintenance.md) — jednorázové a opakované plány,
  výskyty, navázané úkoly, historie, dokumenty, náklady a dashboard.
- [Recepty](recipes.md) — household kuchařka, Decimal množství, jednotky,
  porce, kroky, tagy a dokumentové vazby.
- [Jídelníček](meal-planning.md) — date-only týdenní plán, typy jídel,
  účastníci, kopírování týdne a kalendářní souhrn.
- [Nákupní seznamy](shopping-lists.md) — ruční i generované položky,
  preview, kompatibilní agregace a optimistic odškrtávání.
- [Domácí zásoby](pantry.md) — jednoduchý přehled dostupnosti a potvrzovaný
  odečet při generování nákupu.
- [Výpravy](expeditions.md) — trekkingové výpravy, účastníci, balení,
  připravenost, hmotnostní souhrn a vyhodnocení.
- [Výbava](gear.md) — household katalog v gramech, kategorie, dokumentové
  fotografie a bezpečný import obrázku.
- [Gearlisty](pack-lists.md) — opakovaně použitelné snapshotové šablony a
  konkrétní mobilní checklist výpravy.

## Přidání modulu

Před implementací zkopíruj [\_template.md](_template.md), vyplň všechny sekce a
odkaz přidej sem i do [hlavního indexu dokumentace](../README.md). Stav musí
odpovídat skutečnému kódu a testům.
