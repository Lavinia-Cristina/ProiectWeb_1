# CONTEXT — ProiectWeb_1 vocabulary

<!-- graffino-agentic:begin v1 -->
> The approved terms for this project. Use each term exactly as defined, in the part
> of speech given. Never swap in a synonym; never use a word on an _Avoid_ line.
<!-- graffino-agentic:end -->

**Meniu Digital** (noun) — Interfața web accesibilă pe telefonul mobil de către client prin scanarea codului QR la masă, ce afișează preparatele, disponibilitatea calculată în timp real din stoc și lista de alergeni.
_Avoid_: catalog, broșură, meniu fizic

**Masă** (noun) — Una dintre cele 12 unități fizice de servire din restaurant, identificată numeric de la 1 la 12, asociată unui cod QR unic și gestionată prin stările: liberă, ocupată, rezervată (rezervare efectuată verbal prin telefon și semnalizată fizic în sală).
_Avoid_: loc, birou, stație

**Client** (noun) — Persoana așezată la masă care scanează codul QR, consultă meniul digital și vizualizează stadiul preparării comenzii sale fără a necesita un cont de utilizator.
_Avoid_: utilizator generic, cumpărător, oaspete

**Ospătar** (noun) — Membrul personalului de sală care preia comenzile de la mese, selectează opțiunile extra și le transmite direct către bucătărie.
_Avoid_: chelner, servitor, vânzător

**Bucătărie** (noun) — Rolul și ecranul dedicat (Kitchen Display) din zona de preparare a mâncării, care primește comenzile în timp real via SSE sau WebSocket și le marchează ca fiind gata.
_Avoid_: ecran gătit, KDS improvizat

**Casier** (noun) — Membrul personalului responsabil cu interfața casei de marcat, unde vizualizează consumația finală pe masă, înregistrează plata și emite bonul fiscal PDF.
_Avoid_: recepție, caserie fizică, casă de bani

**Ingredient** (noun) — Materia primă contorizată în stocul bucătăriei (ex. burtă de vită, legume, smântână, ardei), necesară pentru prepararea rețetelor.
_Avoid_: aliment, materie, marfă

**Cupă** (noun) — Unitate de măsură specifică pentru porționarea și scăderea din stoc a sosurilor și lichidelor (smântână, oțet, usturoi în oțet).
_Avoid_: lingură, mililitru, măsură lichidă

**Coșuleț** (noun) — Unitate de măsură specifică pentru pâinea servită la preparate (maximum 1 coșuleț per ciorbă).
_Avoid_: porție pâine, felii, bucată pâine

**Porție** (noun) — Unitate de măsură utilizată pentru carnea și legumele din compoziția rețetelor sau a garniturilor (ex. burtă de vită, cartofi, brânză).
_Avoid_: gramaj, bucățele, cantitate nedefinită

**Preparat** (noun) — Felul de mâncare sau băutura din meniu, definit printr-o rețetă cu cantități specifice de ingrediente, preț autoritar pe server și listă de alergeni.
_Avoid_: mâncare, produs, item meniu

**Extra** (noun) — Opțiune suplimentară solicitată de client la un preparat (ex. smântână în plus, ardei murați sau verzi suplimentari, brânză la cartofi, sosuri) care consumă unități dedicate din stoc.
_Avoid_: topping, adaos, garnitură secundară

**Comandă** (noun) — Ansamblul de preparate și extra-uri solicitate pentru o masă specifică, calculată exclusiv pe server și urmărită prin stările: plasată, în preparare, gata, servită, achitată (cu alertă vizuală derivată dacă este întârziată).
_Avoid_: tichet, bon de comandă, cerere

**Comandă Întârziată** (noun) — Comandă aflată în preparare la bucătărie a cărei durată a depășit pragul de 10–15 minute de la transmitere.
_Avoid_: comandă expirată, întârziere critică

**Bon Fiscal** (noun) — Document PDF generat pe server care atestă plata comenzii unei mese, conținând produsele consumate, valorile calculate de server și metoda de plată.
_Avoid_: chitanță de mână, notă informativă, factură

**POS Fizic** (noun) — Terminalul bancar hardware prezent la restaurant prin care clientul achită cu cardul, confirmat manual în aplicație de către casier.
_Avoid_: procesator online, plată virtuală, gateway de plată
