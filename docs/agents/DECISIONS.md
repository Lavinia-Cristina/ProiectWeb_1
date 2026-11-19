# Decisions — ProiectWeb_1

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Node.js și Express pentru backend
- D-002 · Transmitere comenzi în timp real via SSE sau WebSocket
- D-004 · Calcul autoritar al prețurilor pe server și test anti-manipulare
- D-005 · Generare server-side pentru coduri QR și bonuri fiscale PDF
- D-006 · Consum cumulativ pe masă și bon fiscal unic la încasare

---

## D-001 · Node.js și Express pentru backend
- **Status:** approved
- **Rule:** Backend-ul aplicației va fi dezvoltat pe platforma Node.js folosind framework-ul Express.
- **Why:** Oferă simplitate în dezvoltare, performanță ridicată și suport nativ pentru stream-uri și conexiuni în timp real (SSE/WebSocket).
- **Evidence:** Decizie agreată cu utilizatorul în interviul de arhitectură din 2026-11-18.
- **Confirmed:** 2026-11-18

## D-002 · Transmitere comenzi în timp real via SSE sau WebSocket
- **Status:** approved
- **Rule:** Transmiterea comenzilor și actualizarea stărilor către Kitchen Display și ecranele meselor se realizează prin Server-Sent Events (SSE) sau WebSocket, fără reîncărcare de pagină (refresh) și fără polling la secundă.
- **Why:** Necesar pentru operativitatea restaurantului, eliminând latența și consumul inutil de resurse prin polling repetat.
- **Evidence:** Cerință tehnică specifică P02 menționată de utilizator la 2026-11-18.
- **Confirmed:** 2026-11-18

## D-004 · Calcul autoritar al prețurilor pe server și test anti-manipulare
- **Status:** approved
- **Rule:** Totalul comenzii se calculează exclusiv pe server din prețurile oficiale din baza de date; clientul trimite doar identificatorii preparatelor și cantitățile/extra-urile. Sistemul va include un test automatizat dedicat ce atestă că orice valoare de preț transmisă de client este ignorată.
- **Why:** Asigură integritatea financiară a plăților și previne fraudarea comenzilor din interfața web.
- **Evidence:** Cerință tehnică specifică P02 menționată de utilizator la 2026-11-18.
- **Confirmed:** 2026-11-18

## D-005 · Generare server-side pentru coduri QR și bonuri fiscale PDF
- **Status:** approved
- **Rule:** Generarea codurilor QR aferente celor 12 mese și generarea documentelor pentru bonul fiscal se realizează direct pe server în format PDF (utilizând biblioteci Node.js precum qrcode și pdfkit).
- **Why:** Elimină dependențele de servicii externe pentru QR și oferă un format standard descărcabil și tipăribil pentru bonul fiscal.
- **Evidence:** Cerință tehnică specifică P02 menționată de utilizator la 2026-11-18.
- **Confirmed:** 2026-11-18

## D-006 · Consum cumulativ pe masă și bon fiscal unic la încasare
- **Status:** approved
- **Rule:** Toate articolele comandate succesiv pe o masă activă se cumulează pe masa respectivă; casierul încasează întreaga consumație a mesei pe un singur document bon fiscal PDF la finalul servirii, moment în care masa devine liberă.
- **Why:** Asigură fluxul operațional corect din restaurant unde oaspeții pot comanda suplimentar pe parcursul mesei și achită o singură notă de plată consolidată.
- **Evidence:** Confirmat de utilizator în sesiunea din 2026-11-19 (opțiunea A).
- **Confirmed:** 2026-11-19
