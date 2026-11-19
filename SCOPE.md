# Specificație de Domeniu (Scope) — P02: Meniu Digital + Comenzi cu Stoc pe Ingrediente

**Versiune:** 1.0  
**Data:** 18 Noiembrie 2026  
**Status:** Definit în urma interviului tehnic  
**Depozit:** [ProiectWeb_1](file:///D:/Program%20Files/ProiectWeb_1/ProiectWeb_1)

---

## 1. Descriere Generală & Context
Proiectul **P02** reprezintă o aplicație web completă pentru restaurante (dimensionată inițial pentru un local cu **12 mese**), destinată optimizării fluxului de comandă, comunicării în timp real între sală și bucătărie și scăderii automate, tranzacționale, a stocului de ingrediente.

---

## 2. Roluri & Utilizatori (Roles)

| Rol | Descriere & Acces | Responsabilități principale |
| :--- | :--- | :--- |
| **Client (la masă)** | Acces direct via scanare cod QR (fără cont/parolă) | Consultă meniul digital în timp real, vizualizează disponibilitatea preparatelor (în funcție de stoc), consultă lista de alergeni și urmărește stadiul preparării comenzii sale („În preparare” ➔ „Gata”). |
| **Ospătar** | Interfață dedicată pentru sală | Selectează masa (1–12), configurează preparatele cu opțiuni extra și trimite comanda către bucătărie. Vizualizează starea meselor și a comenzilor. |
| **Bucătar (Bucătărie)** | Kitchen Display System (KDS) în timp real | Primește instant comenzile noi (via SSE/WebSocket), vede timpul scurs (cu alertă vizuală la >10–15 min întârziere) și marchează preparatele/comanda ca „Gata”. |
| **Casier (Casa de marcat)** | Interfață de încasare / gestiune masă | Vizualizează comanda finală pentru masă, totalul calculat de server, înregistrează metoda de plată (Card POS fizic sau Numerar) și emite bonul fiscal în format PDF. |
| **Monitor Restaurant** | Ecran pasiv / tablou de afișaj în sală | Afișează comenzile active și stadiul lor pentru coordonarea personalului. |

---

## 3. Date & Variabile de Sistem (Data Model)

### 3.1. Mese
- Identificator: Număr masă (`1` – `12`).
- Stare: `liberă`, `ocupată`, `rezervată`.
- Cod QR unic asociat fiecărei mese (generat pe server).

### 3.2. Ingrediente & Stocuri
- Identificator, denumire, unitate de măsură concretă:
  - **Cupe:** smântână, oțet, usturoi în oțet.
  - **Bucăți / Porții:** burtă de vită, castraveți, roșii, varză, ardei murați, ardei verzi, brânză, porții cartofi etc.
  - **Coșulețe:** pâine (max. 1 per ciorbă).
- Cantitate în stoc curent (`current_stock`).
- Prag minim de alertă stoc critic.

### 3.3. Preparate & Rețete
- Denumire, categorie (ex. Ciorbe, Garnituri, etc.), preț unitar (autoritar pe server), listă alergeni.
- **Rețetă (Compoziție ingrediente):** Fiecare preparat conține o listă de ingrediente și cantitățile necesare (ex. Ciorbă de burtă: 1 porție burtă, 1 cupă smântână, 1 cupă oțet, 1 cupă usturoi în oțet, max. 1 coșuleț pâine).
- **Disponibilitate dinamică:** Un preparat este calculat automat ca `indisponibil` (stoc epuizat) dacă stocul oricărui ingredient din rețetă nu acoperă o porție completă.

### 3.4. Extra-uri (Opțiuni Suplimentare)
- Opțiuni frecvente (identificate în interviu):
  1. Ardei murați vs. ardei verzi (consum bucăți).
  2. Smântână în plus (consum 1 cupă smântână).
  3. Brânză la cartofi (consum 1 porție brânză).
  4. Ketchup / Maioneză (consum unități sos).
- Fiecare extra consumă cantități specifice din stocul ingredientului aferent și poate avea un cost suplimentar.

### 3.5. Comenzi
- `id_comanda`, `numar_masa`, `timestamp_plasare`.
- Listă articole (`preparat_id`, `cantitate`, opțiuni extra selectate).
- **Stare comandă:** `plasată` ➔ `în preparare` (cu marcaj `întârziată` la >10–15 min) ➔ `gata de servire` ➔ `servită` ➔ `achitată`.
- **Total de plată:** Calculat strict pe backend.

### 3.6. Plăți & Bon Fiscal
- Metodă de plată: `Card` (via terminal POS fizic existent) sau `Numerar`.
- Bon fiscal: Document **PDF** generat pe server cu datele fiscale, produsele consumate și totalul achitat.

---

## 4. Ecrane & Interfețe (Screens)

1. **Ecran 1: Client QR (Meniu Digital Mobil)**
   - Afișare meniu pe categorii.
   - Evidențiere automată: preparate disponibile vs. preparate epuizate (stoc 0).
   - Fereastră modală / secțiune dedicată pentru **alergeni**.
   - Notificare/card de stare pentru comanda mesei: afișează când bucătăria a marcat comanda ca fiind gata.

2. **Ecran 2: Ospătar (Preluare Comandă)**
   - Selector masă (1–12).
   - Adăugare preparate și selecție rapidă de extra-uri (cupe smântână, ardei, pâine etc.).
   - Buton de confirmare și trimitere automată către bucătărie.

3. **Ecran 3: Kitchen Display System (KDS - Bucătărie)**
   - Panou de tichete de comandă actualizate în timp real (SSE / WebSocket).
   - Cronometru per comandă cu alertă cromatică când comanda depășește 10–15 minute.
   - Buton acțiune: „Marchează Gata”.

4. **Ecran 4: Casier / Încasare**
   - Vizualizare consumație pe fiecare masă.
   - Afișare total calculat de server.
   - Butoane selecție plată: „Plată Card (POS)” / „Plată Numerar”.
   - Buton „Emite Bon Fiscal (PDF)” – descarcă/afișează PDF-ul generat de server.

5. **Ecran 5: Monitor Restaurant (Public Display)**
   - Tablou sinoptic afișat în local cu comenzile active și starea lor.

6. **Ecran 6: Administrare Stocuri & Rețete (Admin)**
   - Panou de control pentru inventar ingrediente (cupe/porții/coșulețe), actualizare stocuri aprovizionare și gestionare rețete.

7. **Ecran 7: Printare Coduri QR Mese**
   - Format printabil A4 al standurilor cu coduri QR asociate meselor 1–12.

---

## 5. Cerințe Tehnice & Arhitecturale Obligatorii

1. **Tehnologie Backend:**
   - **Node.js** cu Express (simplu, performant și ușor de întreținut).
   - Bază de date relațională ușoară: **SQLite** (fișier local, fără dependențe externe de server DB).

2. **Timp Real (Real-Time KDS):**
   - Utilizare **Server-Sent Events (SSE)** sau **WebSocket** pentru propagarea comenzilor către Kitchen Display și ecranul clientului, fără refresh manual și fără polling repetat la secundă.

3. **Calcul Autoritar & Securitate Prețuri:**
   - Totalul comenzii se calculează **exclusiv pe server**.
   - Clientul transmite doar payload-ul: `{ tableNumber, items: [{ dishId, quantity, extras: [...] }] }`.
   - Test unitar/integrare dedicat care demonstrează că transmiterea unui câmp `price` sau `total` manipulat din frontend este complet ignorat.

4. **Gestiune Atomică pentru Stocuri:**
   - Verificarea și scăderea stocului de ingrediente se realizează atomic la nivel de server.
   - Dacă o comandă include preparate ale căror ingrediente necesare depășesc stocul disponibil, comanda este respinsă fără a modifica baza de date.

5. **Generare pe Server:**
   - Generare coduri QR pentru fiecare din cele 12 mese direct pe server (URL cu identificator de masă).
   - Generare document **PDF** pentru bonul fiscal pe server.

---

## 6. Delimitări Stricte — Ce NU este în proiect (Out of Scope)

- ❌ **Fără livrări la domiciliu sau takeaway:** Sistemul este proiectat exclusiv pentru servire în restaurant la cele 12 mese.
- ❌ **Fără conturi de utilizator sau parole pentru clienți:** Accesul clienților este instant prin scanarea codului QR.
- ❌ **Fără procesator de carduri online integrat:** Plata cu cardul se efectuează la POS-ul fizic existent în restaurant; în aplicație se înregistrează doar confirmarea tranzacției de către casier.

---

## 7. Registru de Întrebări Deschise (Open Questions)

Toate aspectele inițiale au fost clarificate și aprobate cu utilizatorul la 2026-11-19:
- **Q-001 / Q-002 (Stack & Scope):** Aprobate (Node.js/Express, SQLite, SSE/WS, PDF, QR; Restaurant 12 mese Kon Tiki).
- **Q-003 (Stocuri & Rețete):** Rezolvat prin ecranul dedicat de Admin (`DS-kt-admin`) și scriptul inițial de seed.
- **Q-004 (Rezervări Mese):** Rezolvat prin rezervare verbală telefonică, consemnată de ospătar în aplicație și semnalizată fizic la masă.
- **Q-005 (Imprimare Fiscală):** Rezolvat prin documentul PDF generat pe server conform deciziei D-005.
