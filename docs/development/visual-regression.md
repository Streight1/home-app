# Vizuální regresní testy

## Účel

Screenshot baseline chrání rozložení, motivy a responzivní kompozice HomeApp.
Nejsou náhradou funkčních ani accessibility testů. Baseline se nevytvářejí
v hostitelském browseru, protože rasterizaci ovlivňuje operační systém,
fontconfig, sada fontů i konkrétní Chromium build.

## Kanonické prostředí

Jediným zdrojem baseline je image:

```text
mcr.microsoft.com/playwright:v1.61.1-noble@sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48
```

Kontrakt v `apps/web/e2e/visual-baseline.json` připíná:

- Playwright 1.61.1;
- Chromium revision 1228, verzi 149.0.7827.55;
- Ubuntu 24.04 Noble;
- lokálně balený Inter 5.2.8;
- systémové locale `C.UTF-8`, browser locale `cs-CZ`;
- timezone `Europe/Prague`;
- device scale factor 1 a reduced motion.

Před screenshotem společný helper nastaví pevný čas, čeká na
`document.fonts.ready`, dva animation frames a vypne animace, transition
a caret. Samostatný test ověřuje skutečný Inter na referenčním textu včetně
rozměru 248 × 24 CSS px. Vzdálené font CDN se nepoužívá.

## Kontrola baseline

Standardní kontrola vždy spustí připnutý container:

```bash
pnpm visual:verify
pnpm visual:check:container
```

`pnpm test:visual` je alias stejné kontejnerové kontroly. Hostitelský Playwright
nemá povolený běžný aktualizační script. Pro ověření determinismu lze příkaz
spustit dvakrát; druhý běh nesmí změnit PNG ani výsledek.

## Vědomá aktualizace

Aktualizaci prováděj až po prohlédnutí `expected`, `actual` a `diff`:

```bash
pnpm visual:update:container
```

Script standardně vyžaduje čistý working tree. Při vědomé práci v již
rozpracované větvi lze po kontrole změn použít:

```bash
pnpm visual:update:container --allow-dirty
```

Příkaz pouze přegeneruje PNG v kanonickém containeru a vypíše jejich seznam.
Nevytváří commit ani push. CI nikdy nepoužívá `--update-snapshots`.

Po aktualizaci:

1. prohlédni reprezentativní light/dark a mobile/tablet/desktop obrázky;
2. zkontroluj všechny změněné PNG v diffu;
3. spusť dvakrát `pnpm visual:check:container`;
4. spusť accessibility a úplnou projektovou bránu;
5. commitni metadata a PNG společně.

## Checklist code review

- Layout odpovídá záměru a žádný text není oříznutý.
- Stránka ani komponenta nemá nechtěný overflow.
- Light a dark motiv zachovávají kontrast a významové barvy.
- Mobile, tablet a desktop používají správnou kompozici.
- Diff není neprozkoumaná změna fontu nebo rasterizace.
- Screenshot neobsahuje osobní, produkční ani finanční data.
- Skutečná regrese je opravená před aktualizací baseline.

## Upgrade Playwrightu

Změna `@playwright/test` vyžaduje současně:

1. změnit přesný Playwright container a ověřit jeho digest;
2. aktualizovat Chromium revision/version v metadata;
3. ověřit fontovou metriku;
4. spustit současné baseline proti novému prostředí;
5. klasifikovat reprezentativní diffy;
6. teprve potom vědomě aktualizovat PNG a datum review;
7. dvakrát spustit celou visual sadu.

Validator zastaví CI před screenshoty, pokud package, browser, image nebo
metadata nesouhlasí.

## Diagnostika CI

Povinný job `Tests / Browser visual` běží v kanonickém containeru odděleně od
`Tests / Browser accessibility`. Při chybě uloží na sedm dnů:

- HTML report;
- `expected`, `actual` a `diff` vložené do reportu;
- trace pouze z prvního retry selhaného testu;
- JSON výsledek a baseline metadata.

Video je vypnuté a screenshot mimo screenshot assertion vzniká pouze při
selhání. Artifact nesmí obsahovat `.env`, cookies, tokeny ani produkční data.
Publish job nadále závisí na obou browser jobech.
