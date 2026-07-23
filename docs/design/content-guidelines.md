# Pravidla UI obsahu

## Tón

Text je český, krátký, konkrétní a klidný. Moderní vzhled Aurora nemění produkt
v marketingovou prezentaci. Text vysvětluje stav a další možný krok bez
žargonu, infantilnosti nebo falešného nadšení.

Používej „Přidat dokument“, „Zatím tu nic není.“, „Zkuste to znovu.“,
„Připravujeme“ a konkrétní průběhové stavy. Nepoužívej „Oops!“, emotikony,
„Awesome!“, neurčité chyby ani názvy cizích produktů v UI.

## Motiv

Volby se vždy jmenují „Podle systému“, „Světlý“ a „Tmavý“. Aktivní hodnota je
vyjádřená stavem radio group a podle kontextu doplněná textem. Nepoužívej pouze
ikonu slunce či měsíce bez dostupného českého názvu.

## Prázdné a připravované stavy

- nadpis stručně pojmenuje současný stav;
- popis vysvětlí, co se zde později zobrazí;
- neaktivní ovládání je disabled a doplněné „Připravujeme“;
- absence backendu se nesmí maskovat falešnými produkčními daty;
- fixture data zůstávají ve Storybook/test adresáři.

## Chyby a průběh

- chyba popíše neúspěšnou činnost a bezpečný další krok;
- loading používá průběhový tvar, například „Ověřujeme přihlášení…“;
- technické kódy, stack trace a bezpečnostní detaily nepatří do UI;
- alert nepřenáší význam pouze barvou, používá ikonu, roli a text.

## Ovládání

Button používá sloveso a předmět. Ikonové tlačítko má plný přístupný název,
například „Sbalit navigaci“. Dialog a sheet mají konkrétní title a close label.
Label nesmí spoléhat jen na ikonu, placeholder, glow nebo barvu.
