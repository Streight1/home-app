# Dokumentace HomeApp

Tento rozcestník je vstupem do verzované projektové dokumentace. Skutečné
chování má vždy přednost před zastaralým textem; při rozporu dokument oprav.

## Začínáme

- [Kořenový README](../README.md) — stručný účel, technologie a rychlé spuštění.
- [Lokální vývoj](development/local-development.md) — úplná instalace, konfigurace a práce se službami.
- [Přispívání](../CONTRIBUTING.md) — workflow změny, kontroly a definice dokončení.
- [Slovník](glossary.md) — význam doménových a bezpečnostních pojmů.

## Architektura

- [Přehled](architecture/overview.md) — monorepo, aplikace, datové toky a hlavní hranice.
- [Frontend](architecture/frontend.md) — feature struktura, router, Query, API klient a design tokeny.
- [Backend](architecture/backend.md) — NestJS moduly, guardy, služby, Prisma a chyby.
- [Datový model](architecture/data-model.md) — význam Prisma entit, vztahů a mazacího chování.
- [Autentizace a autorizace](architecture/authentication-and-authorization.md) — Google login, session, CSRF, access modes a household oprávnění.
- [Storage](architecture/storage.md) — lokální soubory, runtime data a bezpečnost cest.
- [Deployment](architecture/deployment.md) — single-VPS topologie, image, sítě, perzistence, migrace a health.

## Produktový design

- [Design rozcestník](design/README.md) — vstup do produktového UI systému a povinné čtení pro UI změny.
- [Product UI brief](design/product-ui-brief.md) — charakter HomeApp Aurora a hranice návrhu.
- [Responsive layouts](design/responsive-layouts.md) — compact, medium a expanded kompozice.
- [Screen map](design/screen-map.md) — současné routy, obrazovky a pravdivé stavy.
- [Component inventory](design/component-inventory.md) — implementované primitives, shell a Storybook pokrytí.
- [Reference board](design/reference-board.md) — zdroje inspirace a explicitní zákaz kopírování.
- [Content guidelines](design/content-guidelines.md) — pravidla krátkých a klidných českých textů.

## Vývoj

- [Codex workflow](development/codex-workflow.md) — povinný životní cyklus agentního úkolu.
- [Continuous integration](development/continuous-integration.md) — čistý
  runner, povinné joby, PostgreSQL/browser/container testy a GHCR publish.
- [Coding standards](development/coding-standards.md) — TypeScript, moduly, pojmenování a velikost souborů.
- [Testing](development/testing.md) — testovací vrstvy, mocky a bezpečnostní scénáře.
- [Vizuální regrese](development/visual-regression.md) — kanonický Playwright
  container, kontrolovaná aktualizace baseline a diagnostika diffů.
- [Databázové migrace](development/database-migrations.md) — bezpečný vývoj a aplikace Prisma migrací.
- [Pravidla dokumentace](development/documentation-rules.md) — zdroje pravdy a mapování změn na dokumenty.

## Funkční moduly

- [Rozcestník features](features/README.md) — seznam skutečně dokumentovaných aplikačních oblastí.
- [Šablona feature](features/_template.md) — povinná struktura budoucí feature dokumentace.
- [Autentizace](features/authentication.md) — současný Google login, relace, UI, API a omezení.
- [Dokumenty](features/documents.md) — prezentační knihovna, adaptivní modály,
  archiv, koš, bezpečný permanent delete a household oprávnění.
- [Vytěžování dat](features/document-extraction.md) — layout-aware PDF bloky,
  fakturové strategie, line items, confidence a review návrhů.
- [Úkoly](features/tasks.md) — úkoly, více účastníků, termíny, recurrence,
  dokončovací historie, dokumentové vazby a dashboard.
- [Plánování úkolů](features/task-scheduling.md) — hledání společných slotů,
  participant-specific cesty a explicitně potvrzená calendar vazba.
- [Kalendář](features/calendar.md) — sdílené události, přesné pracovní směny,
  účastníci/barvy, cílové šablony, time-grid, feed úkolů a dnešní model.
- [Místa a plánování cesty](features/locations-and-travel.md) — autocomplete
  výchozího místa i cíle, Mapy.com Suggest/Geocoding/Route adaptéry, AUTO
  origin, odjezd, konflikty a view preference bez cache provider výsledků.
- [Workspace navigace](features/workspace-navigation.md) — jediná `/app` URL,
  validovaný history/session stav a feature hosty.
- [Členové sdílené domácnosti](features/household-members.md) — stabilní
  bootstrap, OWNER/MEMBER admission a read-only členové.
- [Finance](features/finance.md) — účty, kategorie, ruční ledger, atomické
  převody, dokumentové vazby, zůstatky a oddělené měnové souhrny.
- [Finance importy](features/finance-imports.md) — CSV průvodce, importní
  profily, preview, deduplikace, cleanup a kreditní účty.
- [Kategorizace financí](features/finance-categorization.md) — normalizovaní
  obchodníci, prioritní pravidla a hromadné zařazení.
- [Finanční analytika](features/finance-analytics.md) — category breakdown,
  trend, top obchodníci, porovnání období a interní drill-down.
- [Finanční rozpočty](features/finance-budgets.md) — měsíční a kategoriální
  limity, čerpání, forecast a dashboard.
- [Zjištění o výdajích](features/spending-insights.md) — vysvětlitelné odchylky,
  srovnávací medián a bezpečné stavy insightů.
- [Opakované výdaje](features/recurring-expenses.md) — detekce, potvrzení a
  evidence pravidelných plateb bez bankovní automatizace.
- [Sdílený roční Bucket list](features/bucket-list.md) — společná přání,
  účastníci, dokumenty, roční postup a bezpečný převod do dalšího roku.

## API

- [Katalog endpointů](api/endpoints.md) — public, authenticated a internal endpointy včetně CSRF a statusů.

## Provozní postupy

- [Google OAuth](runbooks/google-oauth.md) — nastavení Google Cloud pro lokální login.
- [Záloha a obnova](runbooks/backup-and-restore.md) — bezpečný plán pro PostgreSQL a uploady.
- [Troubleshooting](runbooks/troubleshooting.md) — řešení databáze, Prisma, Google, cookies, CSRF a storage.
- [Mapy.com API](runbooks/mapy-api.md) — bezpečné klíče, konfigurace,
  attribution, smoke test a provider chyby.
- [VPS staging deployment](runbooks/vps-deployment.md) — DNS, firewall, Caddy,
  první start, aktualizace, logy, záloha, obnova a provozní chyby.
- [One-command deployment](runbooks/one-command-deployment.md) — start a
  aktualizace hotových image, runtime config, named volumes a maintenance.
- [Container registry](runbooks/container-registry.md) — GHCR image, tagy,
  GitHub Actions publishing a veřejný/privátní přístup.

## Architektonická rozhodnutí

- [ADR 0001](adr/0001-modular-monolith.md) — pnpm monorepo a modulární monolit.
- [ADR 0002](adr/0002-google-auth-and-server-sessions.md) — Google Identity Services a serverové relace.
- [ADR 0003](adr/0003-centralized-environment-configuration.md) — jediný kořenový `.env` pro Compose, API, Prisma a Vite.

## Aktuální stav a roadmapa

- [Stav projektu](project-status.md) — implementované části, omezení a poslední skutečné kontroly.
- [Roadmapa](roadmap.md) — Now, Next, Later a volné Ideas bez termínových slibů.
- [Changelog](../CHANGELOG.md) — historie pouze skutečně implementovaných změn.
- [Bezpečnost](../SECURITY.md) — závazné bezpečnostní zásady a hlášení chyb.
- [Design](../DESIGN.md) — jediný zdroj vizuálních pravidel.
- [Agentní pravidla](../AGENTS.md) — závazné hranice pro další vývojové agenty.
