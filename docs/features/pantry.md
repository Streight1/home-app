# Domácí zásoby

## Rozsah

`PantryItem` je jednoduchý household přehled suroviny, volitelného Decimal
množství a jednotky, stavu `AVAILABLE`, `LOW`, `OUT` nebo `UNKNOWN`, expirace,
umístění a plain-text poznámky. Nejde o účetní nebo plnohodnotný sklad.

OWNER, ADMIN a MEMBER mohou zásoby upravovat, VIEWER pouze čte. Ingredient i
pantry položka musí patřit stejné domácnosti; cizí entity používají stejnou
obecnou 404 jako neexistující.

Formulář podporuje vytvoření i úpravu množství, jednotky, stavu, data spotřeby,
umístění a poznámky. Odstranění má samostatné potvrzení a auditní událost;
nejde o automatický pohyb zásob.

## Odečet při nákupu

Zásoba se nikdy neodečte automaticky bez preview. Odečet se provádí jen pro
stejnou surovinu a kompatibilní dimenzi jednotek. Stav `AVAILABLE` bez
množství je pouze upozornění „pravděpodobně doma“ a vyžaduje explicitní
rozhodnutí uživatele. Odškrtnutí nákupní položky samo nezvyšuje množství doma.

Množství API vrací jako decimal string; převod `g ↔ kg` a `ml ↔ l` používá
stejnou přesnou measurement knihovnu jako recepty a nákupní agregace.
