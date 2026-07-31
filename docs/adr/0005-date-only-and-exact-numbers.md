# ADR 0005: Date-only a přesná čísla

- Stav: přijato
- Datum: 2026-07-31

## Kontext

Úkoly, kalendář, údržba, jídla a výpravy pracovaly se stejným kalendářním dnem,
ale měly několik parserů a některé používaly UTC půlnoc, jiné UTC poledne.
Meals a Expeditions obdobně duplikovaly technickou validaci Decimal stringu.
Peníze, gramové hmotnosti a quantity však mají rozdílnou doménovou semantiku.

## Rozhodnutí

Backend používá jediný Gregorian date-only primitive a explicitní DB adaptér.
Date-only není instant a nesmí být parsované implicitním UTC konstruktorem.
Technická Decimal validace a serializace je sdílená, veřejný přenos zůstává
string.

Money zůstává `BigInt` minor units, weight integer grams, duration integer
minutes a recipe/gear quantity Decimal. Jednotkové konverze a rounding zůstávají
v příslušných doménách.

## Důsledky

DST a neplatná Gregorian data mají jednu testovanou implementaci. Sdílení
nevede ke generickému `Quantity`, který by dovolil sečíst nesouvisející hodnoty.
Frontendové date-only helpery se mohou sjednocovat postupně za stejným
kontraktem; tato volba nevyžaduje migraci uložených PostgreSQL `DATE` hodnot.
