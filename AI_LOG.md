# Jurnal Sesiune AI — P02: Meniu Digital + Comenzi cu Stoc pe Ingrediente

**Data:** 18 Noiembrie 2026  
**Proiect:** [ProiectWeb_1](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1)  
**Obiectiv sesiune:** Deblocare sincronizare Git, interviu tehnic complet pentru stabilirea domeniului de aplicare (Scope), actualizarea registrului agentic și formalizarea deciziilor tehnice pentru susținere.

---

## 1. Ce am cerut (Întrebările adresate)

Am derulat un interviu structurat, pas cu pas (întrebare cu întrebare), fără a scrie cod și fără a face presupuneri despre client:
1. **Rolurile din aplicație:** Cine sunt utilizatorii (clienți la mese, ospătari, bucătărie, casier, manager)?
2. **Gestiunea stocurilor și rețetelor:** Cine și cum introduce rețetele și stocurile inițiale de aprovizionare?
3. **Date & Unități de măsură:** Cum se măsoară ingredientele (porții, unități simple, grame, cupe) și cum sunt tratate cerințele extra?
4. **Ecrane (UI):** Care sunt ecranele necesare în restaurant?
5. **Delimitări stricte (Out of Scope):** Ce NU trebuie inclus (livrări, conturi clienți, gateway online etc.)?
6. **Flux rezervări:** Cum funcționează rezervările de mese și ce date se colectează?
7. **Plată și fiscalitate:** Cum se efectuează plata cu cardul și imprimarea fiscală?
8. **Cerințe tehnice & Stack:** Există cerințe specifice impuse de temă și care este preferința pentru backend (Node.js vs. Python)?
9. **Selecția deciziilor:** Care decizii tehnice sunt aprobate pentru a fi susținute în fața comisiei?
10. **Interviu de stil (Design):** Identitatea vizuală a localului, atmosferă/ton, preferințe de culori, tipografie (fonturi) și referințe vizuale.

---

## 2. Ce am primit (Răspunsurile utilizatorului)

1. **Roluri:**
   - Client la masă: scanează cod QR la una din cele 12 mese, vede mâncărurile valabile/indisponibile, lista de alergeni și când mâncarea este gata.
   - Ospătar: preia comenzile de la mese și le trimite la bucătărie; urmărește comenzile pe ecran.
   - Bucătar: ecran dedicat unde primește comenzile și le marchează când sunt gata.
   - Casier: monitor la casă cu ce a consumat clientul.
   - Restaurant: ecran/monitor în sală care arată comenzile plasate.
2. **Gestiune stoc inițial/rețete:** *„Nu s-a stabilit încă la nivel de client”* (necunoscută).
3. **Măsurare stoc & extra-uri:**
   - La nivel de unitate/cupă/coșuleț:
     - Smântână și ardei: la unitate (pot fi mai mulți ardei pe o farfurie).
     - Ciorbă de burtă: consumă minim 3 cupe în total (1 smântână, 1 oțet, 1 usturoi în oțet) + maxim 1 coșuleț cu pâine.
4. **Delimitări:**
   - **În proiect:** Se poate plăti cu cardul, există imprimare fiscală, se poate rezerva o masă.
   - **Out of Scope:** NU se fac livrări la domiciliu, NU există conturi/parole pentru clienți.
5. **Rezervări mese:** *„Nu știu”* (necunoscută la nivel de client).
6. **Plată & Imprimare:**
   - Plata cu cardul se face prin **POS fizic**.
   - Imprimarea fiscală dincolo de PDF nu este sigură la nivel de hardware client.
7. **Cerințe tehnice specifice:**
   - Kitchen Display primește comenzile prin **WebSocket sau SSE**, fără refresh și fără polling la secundă.
   - Totalul comenzii se calculează **exclusiv pe server** (clientul trimite doar ID-uri și cantități); obligatoriu test automat care demonstrează respingerea manipulării prețului din client.
   - Generare QR pe server; generare PDF pentru bon.
   - Decrementare stoc tranzacțională: comanda trece toată sau deloc (all-or-nothing).
   - Preferință backend: **Node.js** (cel mai simplu).
8. **Decizii validate pentru susținere:**
   - Aprobate strict deciziile ușor de explicat și apărat la susținere: **D-001, D-002, D-004, D-005** (exclusă tranzacționalitatea ACID complexă pentru simplitate).
9. **Preferințe de stil & Design Kon Tiki:**
   - Nume local: **Kon Tiki**, cu design propriu și bază de meniu alb.
   - Ton și atmosferă: **rustică**.
   - Culori: **tonuri neutre moderne**.
   - Tipografie: **combinație Serif + Sans-serif**.
   - Aprobare: Propunerea de tokens a fost aprobată integral de utilizator (*„Este bine”*).

---

## 3. Ce am făcut cu răspunsul (Acțiuni și Modificări efectuate)

1. **Deblocare Git:**
   - Am oprit procesul blocat de autentificare interactivă (`task-30`).
   - Am configurat Personal Access Token-ul furnizat pe remote-ul GitHub și am executat cu succes `git push -u origin main`.
2. **Elaborare Specificație de Domeniu ([SCOPE.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/SCOPE.md)):**
   - Am redactat documentul complet de Scope detaliind rolurile, modelul de date (12 mese, ingrediente pe cupe/bucăți/coșuri, preparate, extra-uri), cele 5 ecrane, cerințele tehnice și excluderile clare.
3. **Actualizare Documentație Principală ([README.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/README.md)):**
   - Am documentat Scope-ul, Stack-ul tehnologic (Node.js/Express, SQLite, SSE/WebSocket, PDF, QR) și Variabilele detaliate ale sistemului.
4. **Definire Vocabular Client ([CONTEXT.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/CONTEXT.md)):**
   - Am adăugat termenii obligatorii cu definiții și reguli de evitare a sinonimelor (`_Avoid_`): *Meniu Digital*, *Masă*, *Client*, *Ospătar*, *Bucătărie*, *Casier*, *Ingredient*, *Cupă*, *Coșuleț*, *Porție*, *Preparat*, *Extra*, *Comandă*, *Comandă Întârziată*, *Bon Fiscal*, *POS Fizic*.
5. **Gestiune Registru Întrebări Deschise ([docs/agents/OPEN-QUESTIONS.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/OPEN-QUESTIONS.md)):**
   - Am marcat `Q-001` (Stack) și `Q-002` (Scope) ca `answered`.
   - Am transformat necunoscutele declarate de utilizator în întrebări formale deschise:
     - `Q-003`: Cine și cum introduce/actualizează rețetele și stocul de aprovizionare?
     - `Q-004`: Care este fluxul exact pentru rezervările de mese și datele de contact?
     - `Q-005`: Cum se realizează imprimarea fiscală dincolo de PDF-ul generat de server?
6. **Formulare și Aprobare Decizii Tehnice ([docs/agents/DECISIONS.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/DECISIONS.md)):**
   - Am redactat propuneri conform tiparului `PROPOSAL`.
   - În urma selecției utilizatorului, am aprobat exclusiv cele 4 decizii selectate:
     - **`D-001`:** Node.js și Express pentru backend.
     - **`D-002`:** Transmitere comenzi în timp real via SSE sau WebSocket (fără polling/refresh).
     - **`D-004`:** Calcul autoritar al prețurilor pe server și test anti-manipulare.
     - **`D-005`:** Generare server-side pentru coduri QR și bonuri fiscale PDF.
7. **Arhivare Propunere Respinsă ([docs/agents/REJECTED.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/REJECTED.md)):**
   - Am notat respingerea propunerii de tranzacții ACID complexe pentru stoc, păstrând o scădere de stoc directă pe server, ușor de explicat.
8. **Configurare Mediu & Validare Linter:**
   - Am configurat un wrapper funcțional pentru `python3` pe sistem.
   - Am rulat `python3 docs/agents/tools/ledger-lint.py --fix`, obținând statusul de validare: `✓ ledger ok`.
9. **Sistem de Design Tokens ([docs/design/DESIGN.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/DESIGN.md)):**
   - Am generat paleta completă de tokens pentru Restaurantul Kon Tiki (culori neutre calde pe mod Light și Dark, accente rustice cărămizii/teracotă `#8c3a1e`, verde măslină `#4a5548` și chihlimbar `#c97a2b`).
   - Am configurat tipografia mixtă (`Merriweather`/`Lora` serif pentru titluri/preparate + `Inter` sans-serif pentru conținut/ingrediente/KDS).
   - Am stabilit scara de spațiere (8px / bază 4px), razele (`--radius-md: 8px`, `--radius-lg: 12px`, `--radius-full`), umbrele și breakpoint-urile (mobile, tablet, desktop).
   - Propunerea formală a fost înaintată și aprobată de utilizator.

---

## 4. Ghid de susținere a deciziilor tehnice în fața comisiei

Iată cum poți explica simplu, clar și argumentat fiecare decizie tehnică în fața comisiei:

---

### 1. `D-001` · Node.js și Express pentru backend

- **Ce este:** Mediul de rulare (Node.js) și framework-ul de rutare HTTP (Express).
- **De ce l-am ales:**  
  *„Am ales Node.js cu Express deoarece funcționează asincron, pe un model non-blocant bazat pe evenimente (event-driven). Este ideal pentru o aplicație de restaurant unde avem cereri rapide (comenzi, actualizări) și conexiuni deschise în timp real. Express ne permite să creăm rutele REST simplu, rapid și fără cod complicat.”*

---

### 2. `D-002` · Transmitere comenzi în timp real via SSE sau WebSocket

- **Ce este:** Conexiune directă între server și ecranul din bucătărie (Kitchen Display).
- **De ce l-am ales:**  
  *„În mod clasic, ecranul ar trebui să reîncarce pagina sau să întrebe serverul în fiecare secundă dacă a apărut o comandă nouă (polling). Acest lucru ar încărca inutil rețeaua și serverul. Prin Server-Sent Events (SSE) sau WebSocket, serverul păstrează o conexiune deschisă cu bucătăria și împinge instant tichetul de comandă pe ecran exact în momentul în care ospătarul apasă butonul de trimitere.”*

---

### 3. `D-004` · Calcul autoritar al prețurilor pe server și test anti-manipulare

- **Ce este:** Calculul banilor/totalului se face strict în backend, iar frontend-ul transmite doar ID-uri și cantități.
- **De ce l-am ales:**  
  *„Este o măsură esențială de securitate cibernetică și integritate financiară. Niciodată nu avem încredere în datele venite din browser, deoarece un utilizator ar putea modifica din consola browserului un preț de 50 de lei în 1 leu. Serverul nostru ignoră complet orice preț trimis de client și calculează nota de plată folosind prețurile din baza de date. Proiectul include un test automatizat integrat care demonstrează că o încercare de manipulare a prețului este respinsă.”*

---

### 4. `D-005` · Generare server-side pentru coduri QR și bonuri fiscale PDF

- **Ce este:** Crearea codurilor QR pentru mese și a bonului fiscal în format PDF direct de către serverul aplicației.
- **De ce l-am ales:**  
  *„Pentru codurile QR ale celor 12 mese am folosit o bibliotecă internă Node.js (`qrcode`), fără a depinde de API-uri externe care pot fi indisponibile. Pentru bonul fiscal, serverul generează direct un document PDF standardizat (`pdfkit`) cu produsele consumate și totalul calculat, gata de descărcare sau imprimare directă la casa de marcat.”*


---

## Sesiune: 19 Noiembrie 2026 — Regenerare Bază Vizuală & Mock-uri Figma

**Obiectiv sesiune:** Răspuns la comanda de regenerare Figma (`regenerate Figma`). Desenarea completă a mock-urilor HTML în `docs/design/mocks/` pentru toate ecranele din `registry.yaml`, respectând token-urile din `DESIGN.md` și convenția de denumire a frame-urilor Figma (`<DS-id> · <screen>`).

### 1. Ce s-a cerut
- Comanda utilizatorului: `regenerate Figma`.
- În urma clarificării opțiunilor de execuție, a fost aprobată desenarea mock-urilor HTML ca bază vizuală oficială pentru Figma.

### 2. Ce s-a realizat
1. **Generare Mock-uri Ecrane (`kind: screen`):**
   - [`DS-kt-client-menu.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-client-menu.html) — `DS-kt-client-menu · Meniu Digital Client` (mobil).
   - [`DS-kt-order-status.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-order-status.html) — `DS-kt-order-status · Stadiul Comenzii la Masă` (mobil, flux SSE în timp real).
   - [`DS-kt-waiter-orders.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-waiter-orders.html) — `DS-kt-waiter-orders · Preluare Comenzi Ospătar` (tabletă, selector 12 mese, configurator extra).
   - [`DS-kt-kds.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-kds.html) — `DS-kt-kds · Kitchen Display System` (desktop bucătărie, alertă comandă întârziată >10-15 min).
   - [`DS-kt-cashier.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-cashier.html) — `DS-kt-cashier · Ecran Casă / Încasare` (total autoritar server, plată POS fizic/numerar, bon PDF).
   - [`DS-kt-restaurant-monitor.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-restaurant-monitor.html) — `DS-kt-restaurant-monitor · Monitor Central Restaurant` (desktop sală, 12 mese, ticker comenzi gata).
   - [`DS-kt-qr-tables.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-qr-tables.html) — `DS-kt-qr-tables · Printare Coduri QR Mese` (layout A4 standuri QR mese 1–12).

2. **Generare Mock-uri Componente Partajate (`kind: component`):**
   - [`DS-kt-dish-card.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-dish-card.html) — `DS-kt-dish-card · Card Preparat`.
   - [`DS-kt-order-ticket.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-order-ticket.html) — `DS-kt-order-ticket · Tichet Comandă`.
   - [`DS-kt-table-badge.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-table-badge.html) — `DS-kt-table-badge · Indicator Masă`.

3. **Tablou Central de Previzualizare:**
   - [`index.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/index.html) — Design Board unificat pentru vizualizarea și inspectarea tuturor cadrelor Figma, cu comutator temă Light/Dark.

4. **Verificare Calitate:**
   - Linterul registrului `python3 docs/agents/tools/ledger-lint.py` validat cu succes (`✓ ledger ok`).
   - Toate fișierele includ identificatorul de frame Figma `<DS-id> · <screen>` conform cerinței din [DESIGN.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/DESIGN.md#L90-L92).

5. **Aprobare Utilizator (Status Approved):**
   - Utilizatorul a validat calitatea mock-urilor: *„Sunt bune mock-u. Statusul devine approved.”*
   - Toate înregistrările de ecrane și componente din [`docs/design/registry.yaml`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/registry.yaml) au fost promovate de la `status: draft` la `status: approved`.
   - Tabloul [`docs/design/mocks/index.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/index.html) a fost actualizat cu etichetele corespunzătoare `Approved`.

6. **Sincronizare Documentație & Rezolvare Întrebări Deschise:**
   - **Rezolvare Contradicție Stoc:** Aliniat [`README.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/README.md) și [`docs/agents/ARCHITECTURE.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/ARCHITECTURE.md) cu decizia din `REJECTED.md` — s-a eliminat referința la „tranzacții ACID complexe cu rollback distribuit”, păstrând o verificare și decrementare atomică directă pe server în Node.js + SQLite, ușor de explicat și susținut în fața comisiei.
   - **Clarificare Stare Comandă Întârziată:** În [`CONTEXT.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/CONTEXT.md), stările oficiale sunt `plasată`, `în preparare`, `gata`, `servită`, `achitată`, iar `Comandă Întârziată` este un indicator derivat dinamic (>10-15 min) reflectat vizual în KDS.
   - **Închidere `Q-003` (Gestiune Stoc & Rețete):** Utilizatorul a confirmat realizarea ecranului de tip Admin. A fost adăugat ecranul [`DS-kt-admin`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/registry.yaml) în registru și a fost desenat mock-ul complet [`docs/design/mocks/DS-kt-admin.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/DS-kt-admin.html) (tabel inventar cupe/porții/coșulețe, praguri minime, aprovizionare rapidă).
   - **Închidere `Q-004` (Flux Rezervări Mese):** Confirmat că rezervările se fac verbal prin telefon de către client; ospătarul marchează masa ca fiind rezervată în aplicație și plasează un semn fizic pe masă în restaurant. [`CONTEXT.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/CONTEXT.md) a fost actualizat în consecință.
   - **Închidere `Q-005` (Bon Fiscal PDF):** Confirmat că generarea documentului PDF direct pe server conform [D-005](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/DECISIONS.md#L38-L43) acoperă complet cerința de emitere bon fiscal.
   - **Toate întrebările deschise din [`docs/agents/OPEN-QUESTIONS.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/OPEN-QUESTIONS.md) sunt acum oficial `answered`.**

7. **Aprobare Ecran Admin (DS-kt-admin):**
   - Utilizatorul a validat noul ecran de administrare: *„Se poate aproba mock-up”*.
   - În [`docs/design/registry.yaml`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/registry.yaml), starea ecranului `DS-kt-admin` a fost actualizată la **`status: approved`**.
   - Tabloul [`docs/design/mocks/index.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/design/mocks/index.html) a fost actualizat cu eticheta **`Approved`**.
   - În acest moment, **toate cele 8 ecrane și 3 componente** din registru sunt aprobate oficial (`status: approved`).

8. **Clarificare Reguli de Business & Confirmare Varianta A:**
   - **Consum cumulativ pe masă:** Comenzile unei mese se agregă automat pe aceeași masă, casierul încasând întreaga consumație pe un singur bon fiscal PDF la eliberarea mesei.
   - **Flux servire la masă:** Ospătarul confirmă manual pe tabletă predarea preparatelor (`gata` ➔ `servită`).
   - **Cronometru KDS în două trepte:** Alertă galbenă între 10:00 și 14:59 min (atenționare), alertă roșie la ≥15:00 min (critic/întârziat).
   - **Accesibilitate ecrane personal:** Rute dedicate directe fără autentificare blocantă pentru ușurință maximă la susținerea proiectului.
   - Consemnate ca tipare în [`docs/agents/PATTERNS.md`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/PATTERNS.md) (`PATTERN-001`, `PATTERN-002`).
   - Verificarea integrității `python3 docs/agents/tools/ledger-lint.py` validată cu succes (`✓ ledger ok`).

9. **Algoritm de Disponibilitate pentru Servicii Fracționate & Gestiune Atomică (19 Noiembrie 2026):**
   - **Aliniere domeniu Restaurant Kon Tiki:** Eliminat analogia nepotrivită de salon și aplicat modelul pe bucătărie / KDS și servirea pe etape la mesele 1–12.
   - **Toleranță și prioritate validate:** Utilizatorul a confirmat fereastra de toleranță [30, 45] minute pentru faza de așteptare pasivă și prioritatea critică pe KDS pentru Faza 3 (finalizare preparat). Consemnat ca `PATTERN-003` în [docs/agents/PATTERNS.md](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/docs/agents/PATTERNS.md).
   - **Implementare Servicii & DB:**
     - Modulul algoritmic [src/services/availabilityService.js](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/services/availabilityService.js) (algebră pe intervale, interclasare comenzi scurte, calcul dinamic `is_available` pe ingrediente și sortare KDS).
     - Modulul de persistență [src/db/database.js](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/db/database.js) bazat pe `node:sqlite` (DatabaseSync), `placeOrderAtomic` cu `BEGIN IMMEDIATE` / `ROLLBACK` și `bookSplitServiceAtomic` (garanția matematică anti-double booking).
     - Scriptul de seed [src/db/seed.js](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/db/seed.js) cu datele de start Kon Tiki (12 mese, 12 ingrediente pe cupe/porții/coșulețe, rețete și extra-uri).
   - **Validare Automată (`npm test`):**
     - 14 din 14 teste trecute cu succes (anti-manipulare preț server D-004, scădere atomică, garanție anti double-booking, split services cu toleranță și interclasare).
     - Integritatea registrului validată: `python3 docs/agents/tools/ledger-lint.py` (`✓ ledger ok`).

10. **Clarificare Flux Real Bucătărie — Fără Pauze Pasive & SLA 15 Minute (19 Noiembrie 2026):**
    - **Eliminarea pauzelor artificiale din bucătărie:** Utilizatorul a clarificat că în restaurant nu există pauze de tip „split service” (nu există 30 de minute de așteptare pasivă pentru preparate). Mâncarea la Kon Tiki (ciorbe tradiționale, garnituri) se prepară și se livrează în flux continuu în **maximum 15 minute**.
    - **Confirmare Punctele 3 & 4:**
      - Punctul 3 aprobat: Gestiunea atomică a stocului prin tranzacții SQLite `BEGIN IMMEDIATE` garantează că nicio porție de mâncare și niciun slot nu pot fi dublu-alocate chiar dacă două mese comandă concomitent.
      - Punctul 4 aprobat: Prețurile sunt calculate autoritar și exclusiv pe server (D-004), tentativele de fraudă din frontend fiind respinse automat.
    - **Mecanismul de Auto-Escaladare pe KDS (PATTERN-003 actualizat):**
      - $0 - 9:59$ minute: Preparare normală.
      - $10:00 - 14:59$ minute: Atenționare (galben/portocaliu pe KDS).
      - $\ge 15:00$ minute: Comandă Întârziată / Critic (roșu pe KDS).
      - Coada bucătarului auto-escaladează automat: tichetele roșii (>15 min) și galbene (10–15 min) sunt împinse la începutul listei pentru ca bucătarul să le finalizeze primele.
    - **Actualizare Cod & Teste Automate:**
      - Adăugată metoda `AvailabilityService.getKdsAlertStatus` și rafinată `AvailabilityService.prioritizeKdsOrders` în [`src/services/availabilityService.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/services/availabilityService.js).
      - Actualizat [`tests/availabilityService.test.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/tests/availabilityService.test.js) cu teste dedicate pentru fluxul continuu și alertele în 2 trepte.
      - Rezultat teste: **15 din 15 teste trecute cu succes (`npm test`)**.
      - Verificare registru: `python3 docs/agents/tools/ledger-lint.py` $\rightarrow$ `✓ ledger ok`.

11. **Construire Aplicație Completă & Integrare End-to-End (19 Noiembrie 2026):**
    - **Instalare Dependențe:** Adăugat `qrcode` și `pdfkit` pentru conformare strictă cu `D-005` (generare coduri QR și bon fiscal pe server).
    - **Backend & Servicii Implementate:**
      - [`src/realtime/sse.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/realtime/sse.js) — Stream SSE (`/api/events`) pentru sincronizare instantanee pe toate ecranele fără polling (D-002).
      - [`src/services/qrService.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/services/qrService.js) — Generare server-side coduri QR pentru mesele 1–12 în format DataURL și Buffer PNG (D-005).
      - [`src/services/pdfService.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/services/pdfService.js) — Generare bon fiscal oficial PDF la încasare cu antet Kon Tiki, calcul autoritar pe server (D-004), consum cumulativ (D-006) și defalcare articole/extra.
      - [`src/server.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/server.js) — Nucleul Express cu rutare completă REST (`/api/tables`, `/api/menu`, `/api/orders`, `/api/payments`, `/api/qr`, `/api/admin`) și rute statice accesibile direct (PATTERN-001).
    - **Interfețe Web de Producție ([`public/`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/public)):**
      - `public/index.html` — Portal și tablou de bord principal cu statistici live și acces instant la toate ecranele.
      - `public/client-menu.html` — Meniu digital accesat prin QR (`?masa=N`), calcul dinamic disponibilitate din stoc și trimitere comandă.
      - `public/order-status.html` — Urmărire stadiu comandă la masă (`plasată` ➔ `în preparare` ➔ `gata` ➔ `servită`) în timp real via SSE.
      - `public/waiter.html` — Tabletă ospătar cu selector 12 mese, schimbare status masă (inclusiv rezervări telefonice), configurator extra-uri și confirmare servire.
      - `public/kds.html` — Kitchen Display cu cronometru dinamic, alertă în 2 trepte (10-15 min galben, ≥15 min roșu) și auto-escaladare.
      - `public/cashier.html` — Casă de marcat cu agregare consumație masă (D-006), plată Card POS/Numerar și descărcare bon fiscal PDF.
      - `public/monitor.html` — Ecran central sală cu starea celor 12 mese și ticker comenzi gata pentru ospătari.
      - `public/admin.html` — Gestiune inventar ingrediente (cupe/porții/coșulețe), praguri de alertă stoc redus și aprovizionare rapidă.
      - `public/qr-tables.html` — Standuri QR mese 1–12 gata de tipărit pe hârtie A4 (`window.print()`).
    - **Validare Suită de Teste Automate:**
      - Suită extinsă cu teste de integrare end-to-end ([`tests/apiIntegration.test.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/tests/apiIntegration.test.js)).
      - Rezultat: **23 din 23 teste trecute cu succes (`npm test`)** (8 teste API & E2E, 5 teste tranzacții ACID & stoc, 10 teste algoritm KDS & disponibilitate).
      - Integritate registru: `python3 docs/agents/tools/ledger-lint.py` $\rightarrow$ `✓ ledger ok`.

12. **Integrare Meniu Real Kon Tiki & Ghid Oficial Alergeni (19 Noiembrie 2026):**
    - **Procesare imagini furnizate de utilizator:**
      - [`Meniu Kon Tiki.jpg`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/Meniu%20Kon%20Tiki.jpg) — meniul fizic complet cu toate secțiunile, prețurile reale în lei, gramaje și numere exponențiale de alergeni.
      - [`Lista de alergenii.jpg`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/Lista%20de%20alergenii.jpg) — clasificarea celor 15 grupe de alergeni conform Directivei CE 2000-13 și H.G. 751/2008.
    - **Extindere Bază de Date & Servicii:**
      - Adăugat coloana `weight` în tabela `dishes` din [`src/db/database.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/db/database.js).
      - Creat modulul [`src/services/allergenService.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/services/allergenService.js) și endpoint-ul `GET /api/allergens` în [`src/server.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/server.js).
      - Actualizat [`src/db/seed.js`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/src/db/seed.js) cu meniul complet: 93 de preparate cu gramaje reale (ex. `100/300g`, `90 g`, `140 g`, `400g`, `500ml`, `1L`) și mapare pe cele 15 grupe de alergeni.
    - **Îmbogățire Interfață Meniu Client ([`public/client-menu.html`](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1/public/client-menu.html)):**
      - Afișează toate preparatele organizate pe categorii și bară de căutare instantanee.
      - Fiecare preparat afișează vizibil **prețul oficial**, **gramajul/cantitatea** și **etichetele de alergeni**.
      - Buton dedicat în antet: **„📋 Lista Alergeni (CE 2000-13 / H.G. 751)”** ce deschide un modal complet cu cele 15 grupe și detaliile lor.
      - Buton „vezi detalii” per preparat pentru consultarea alergenilor specifici acelui fel de mâncare.
    - **Validare Suită Teste Automate:**
      - **23 din 23 teste trecute cu succes (`npm test`)**.
      - Integritate registru: `python3 docs/agents/tools/ledger-lint.py` $\rightarrow$ `✓ ledger ok`.
