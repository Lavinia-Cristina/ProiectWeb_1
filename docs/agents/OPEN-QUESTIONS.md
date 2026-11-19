# Open questions — ProiectWeb_1

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · Ce stack tehnologic și ce framework web vor fi folosite? · _answered_
- Q-002 · Care este scopul și funcționalitatea principală a aplicației web? · _answered_
- Q-003 · Cine și cum introduce/actualizează rețetele și stocul de ingrediente în sistem? · _answered_
- Q-004 · Care este fluxul exact pentru rezervările de mese? · _answered_
- Q-005 · Cum se realizează imprimarea fiscală dincolo de PDF-ul generat de server? · _answered_

---

## Q-001 · Ce stack tehnologic și ce framework web vor fi folosite?
- **Status:** answered
- **Blocks:** Development setup, build/test commands, dependencies
- **Who answers:** User
- **Answer:** Node.js (Express, Server-Sent Events sau WebSocket pentru comunicare în timp real, SQLite cu suport tranzacțional ACID, generare server-side pentru coduri QR și PDF bon fiscal). Confirmat de utilizator la 2026-11-18.
- **Recorded as:** D-001

## Q-002 · Care este scopul și funcționalitatea principală a aplicației web?
- **Status:** answered
- **Blocks:** Architecture design and feature implementation
- **Who answers:** User
- **Answer:** P02: Meniu digital + comenzi cu stoc pe ingrediente. Restaurant cu 12 mese, afișare dinamică a disponibilității pe baza ingredientelor, ecran de bucătărie în timp real cu avertizare la 10-15 minute, ecran casier cu total calculat autoritar pe server și bon PDF, plată prin POS fizic sau numerar. Confirmat de utilizator la 2026-11-18.
- **Recorded as:** D-001

## Q-003 · Cine și cum introduce/actualizează rețetele și stocul de ingrediente în sistem?
- **Status:** answered
- **Blocks:** Modul dedicat de administrare stocuri și rețete
- **Who answers:** User / Client
- **Proposed answer:** Un ecran simplificat de administrare / inventar accesibil personalului sau managerului pentru setarea stocului inițial și adăugarea aprovizionării.
- **Answer:** Se implementează un ecran dedicat de tip Admin (`public/admin.html`, DS-kt-admin) pentru gestionarea și actualizarea stocului de ingrediente și a rețetelor de către personal, având la bază un set de date inițial (seed). Confirmat de utilizator la 2026-11-19.
- **Recorded as:** D-001

## Q-004 · Care este fluxul exact pentru rezervările de mese?
- **Status:** answered
- **Blocks:** Modulul de rezervări online sau interfața de rezervare pentru personal
- **Who answers:** User / Client
- **Proposed answer:** Pagină publică simplă unde clientul selectează masa (1-12), data/ora și introduce nume și telefon, blocând masa în sistem.
- **Answer:** Rezervarea se face verbal prin telefon — clientul apelează restaurantul, iar ospătarul marchează masa respectivă ca „rezervată” direct în aplicație și așază un indicator fizic pe masă în restaurant pentru a semnala celorlalți oaspeți că masa este ocupată. Confirmat de utilizator la 2026-11-19.
- **Recorded as:** CONTEXT.md

## Q-005 · Cum se realizează imprimarea fiscală dincolo de PDF-ul generat de server?
- **Status:** answered
- **Blocks:** Integrări hardware specifice pentru case de marcat
- **Who answers:** User / Client
- **Proposed answer:** Generarea PDF-ului standard de bon fiscal pe server este suficientă pentru printare directă sau salvare, fără driver hardware nativ.
- **Answer:** Generarea server-side a bonului fiscal în format PDF conform D-005 este complet suficientă pentru descărcare și imprimare standard la casa de marcat, fără cerințe de integrare hardware dedicată. Confirmat de utilizator la 2026-11-19.
- **Recorded as:** D-005 
