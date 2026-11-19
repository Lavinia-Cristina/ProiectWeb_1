# P02: Meniu Digital + Comenzi cu Stoc pe Ingrediente

Aplicație web pentru restaurante (dimensionată pentru un local cu **12 mese**), concepută pentru optimizarea fluxului de servire, transmiterea comenzilor în timp real către bucătărie și gestionarea tranzacțională a stocului de ingrediente.

---

## 1. Scope (Domeniul de aplicare)

### Ce este în proiect
- **Meniu Digital Accesibil prin QR:** Clienții scanează codul QR plasat pe una dintre cele 12 mese și accesează meniul de pe telefonul mobil. Meniul reflectă disponibilitatea preparatelor în timp real (un preparat devine automat indisponibil dacă stocul oricărui ingredient din rețetă ajunge la zero).
- **Afișare Alergeni:** Fiecare preparat include lista completă a alergenilor asociați.
- **Stadiul Comenzii la Masă:** Clientul poate vizualiza pe telefon când mâncarea comandată este în preparare și când este marcată ca fiind gata de către bucătărie.
- **Preluare Comenzi de către Ospătar:** Ospătarul preia comenzile pe masă, selectează opțiuni de tip „extra”, gestionează starea meselor (inclusiv rezervările telefonice) și le transmite instant către bucătărie.
- **Kitchen Display System (KDS):** Ecran dedicat în bucătărie care primește comenzile în timp real (fără reîncărcare de pagină și fără polling la secundă). Comenzile includ cronometru și alertă vizuală când durata depășește pragul de **10–15 minute** (comandă întârziată).
- **Ecran Casă / Încasare:** Casierul vizualizează totalul consumației pe masă (calculat strict pe server), înregistrează metoda de plată (Card prin POS fizic sau Numerar) și emite bonul fiscal în format PDF.
- **Monitor Restaurant:** Ecran central în local pentru afișarea comenzilor active și coordonarea personalului.
- **Ecran Administrare & Stocuri (Admin):** Interfață dedicată personalului pentru gestionarea rețetelor, adăugarea aprovizionării și actualizarea nivelului de stoc pentru ingrediente.
- **Gestiune Atomică a Stocului:** Verificarea și scăderea ingredientelor se realizează atomic pe server — dacă stocul oricărui ingredient din comandă este insuficient, comanda este respinsă fără a altera stocul existent.

### Ce NU este în proiect (Out of Scope)
- ❌ **Fără livrări la domiciliu sau takeaway:** Aplicația deservește exclusiv consumul la mesele din restaurant (mesele 1–12).
- ❌ **Fără conturi de utilizator pentru clienți:** Clienții nu își creează conturi și nu folosesc parole; accesul se face direct prin scanarea codului QR al mesei.
- ❌ **Fără gateway de plăți online integrat:** Plata cu cardul se efectuează la POS-ul bancar fizic existent în restaurant; casierul doar marchează încasarea în sistem.

---

## 2. Stack Tehnologic

- **Runtime & Backend:** Node.js cu framework-ul Express.
- **Bază de Date:** SQLite (verificare și decrementare atomică directă a stocului la nivel de comandă).
- **Comunicare în Timp Real:** Server-Sent Events (SSE) sau WebSocket pentru actualizarea instantanee a ecranului bucătăriei (KDS) și a stării comenzilor.
- **Generare Documente:**
  - Generare coduri QR pe server (asociate meselor 1–12).
  - Generare documente PDF pentru bonurile fiscale direct pe server.
- **Testare & Securitate:** Teste automate integrate, inclusiv test dedicat împotriva manipulării prețului din frontend (totalul se calculează strict autoritar pe server).

---

## 3. Variabile & Entități (Variables & Data Model)

### 3.1. Mese (`tables`)
- `table_number`: Număr de identificare unic (1 până la 12).
- `status`: Stare masă (`liberă`, `ocupată`, `rezervată`).
- `qr_code`: Identificator URL / cod QR asociat mesei.

### 3.2. Ingrediente & Stoc (`ingredients`)
- `id`: Identificator unic ingredient.
- `name`: Denumire ingredient (ex. *burtă de vită*, *castraveți*, *roșii*, *varză*, *ardei murați*, *ardei verzi*, *smântână*, *oțet*, *usturoi în oțet*, *brânză*, *cartofi*, *ketchup*, *maioneză*, *pâine*).
- `unit`: Unitate de măsură concretă:
  - `cupă` (smântână, oțet, usturoi în oțet — ex. ciorba de burtă consumă minim 3 cupe în total);
  - `bucată` / `porție` (burtă de vită, legume, ardei, brânză, cartofi);
  - `coșuleț` (pâine — max. 1 per ciorbă).
- `current_stock`: Cantitatea numerică disponibilă în stoc.
- `min_threshold`: Prag minim pentru alertă de stoc critic.

### 3.3. Preparate & Rețete (`dishes`, `recipe_items`)
- `id`: Identificator preparat.
- `name`: Nume preparat (ex. *Ciorbă de burtă*, *Cartofi cu brânză*).
- `category`: Categorie meniu (ex. *Ciorbe*, *Garnituri*, *Băuturi*).
- `price`: Preț unitar în lei (autoritar pe server).
- `allergens`: Listă de alergeni (ex. *lactoză*, *gluten*, *țelină*).
- `recipe`: Relație compoziție: `[{ ingredient_id, quantity, unit }]`.
- `is_available`: Disponibilitate calculată dinamic (adevărat doar dacă toate ingredientele necesare au `current_stock >= quantity`).

### 3.4. Opțiuni Extra (`dish_extras`)
- `id`: Identificator opțiune extra.
- `name`: Denumire (ex. *Smântână în plus*, *Mai mulți ardei murați*, *Brânză suplimentară la cartofi*, *Ketchup/Maioneză*).
- `ingredient_id`: Ingredientul consumat din stoc.
- `quantity`: Cantitate scăzută (ex. 1 cupă, 2 bucăți).
- `price`: Preț adițional pentru extra.

### 3.5. Comenzi (`orders`, `order_items`)
- `id`: Identificator unic comandă.
- `table_number`: Masa asociată (1–12).
- `status`: Stare comandă (`plasată`, `în preparare`, `gata`, `servită`, `achitată`).
- `placed_at`: Timestamp plasare comandă.
- `is_delayed`: Indicator derivat (activat dacă timpul scurs de la plasare depășește 10–15 minute și comanda nu este gata).
- `items`: Listă articole comandate (`dish_id`, `quantity`, `selected_extras`).
- `total_price`: Valoare totală calculată exclusiv pe server din prețurile oficiale ale preparatelor și extra-urilor.

### 3.6. Încasare & Bon Fiscal (`payments`)
- `id`: Identificator unic plată.
- `table_number`: Masa pentru care s-a efectuat încasarea (1–12).
- `order_ids`: Lista comenzilor consolidate pentru masa respectivă (D-006).
- `payment_method`: `Card` (via POS fizic) sau `Numerar`.
- `total_amount`: Suma totală calculată autoritar pe server.
- `pdf_receipt_path`: Referință la fișierul PDF al bonului generat pe server.
- `paid_at`: Timestamp confirmare încasare.
