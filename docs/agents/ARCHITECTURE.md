# Architecture — ProiectWeb_1

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
Aplicație web pentru restaurant (P02) bazată pe Node.js/Express, SQLite tranzacțional și comunicare în timp real via SSE/WebSocket către Kitchen Display.

```text
[Client QR Mobil / Ospătar / Casier] 
       │ HTTP REST (comenzi, meniu, încasare)
       ▼
 [Node.js Express Server] <════ SSE / WebSocket ════> [Kitchen Display (KDS) & Monitoare]
       │
       ├─► [SQLite DB] (stoc ingrediente, rețete, comenzi, mese)
       ├─► [QR Service] (generare coduri QR mese 1-12)
       └─► [PDF Service] (generare bon fiscal PDF)
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Server Core | `src/server.js` | Rutare Express, endpoint-uri REST, inițializare SSE/WebSocket | Frontend / SQLite |
| Database | `src/db/` | Schemă SQLite, seed inițial și scădere atomică stoc per comandă | Server Core |
| Realtime | `src/realtime/` | Gestionare canale SSE / WebSocket pentru Kitchen Display și mese | Server Core / Frontend |
| Services | `src/services/` | Calcul autoritar total comenzi, generare coduri QR și bonuri PDF | Server Core / SQLite |
| Public / UI | `public/` | Interfețe HTML/CSS/JS (Client QR, Ospătar, KDS Bucătărie, Casier, Monitor, Admin) | Server Core |

## Data flow
1. Client scanează QR masa `N` ➔ Solicită meniu (`GET /api/menu`) ➔ Server calculează disponibilitatea fiecărui preparat pe baza stocului de ingrediente.
2. Ospătar compune comanda ➔ Trimite articole + extra-uri (`POST /api/orders`) ➔ Server execută tranzacție atomică SQLite: verifică stocul tuturor ingredientelor, decrementează stocurile și calculează autoritar totalul.
3. Server emite evenimentul noii comenzi prin SSE/WebSocket ➔ Ecranul KDS din bucătărie afișează comanda instant, cronometrând timpul scurs (>10-15 min = întârziată).
4. Bucătăria marchează comanda „Gata” (`POST /api/orders/:id/ready`) ➔ Evenimentul este propagat către telefonul clientului și monitorul din restaurant.
5. Casierul accesează consumația mesei ➔ Înregistrează plata POS/Numerar (`POST /api/orders/:id/pay`) ➔ Server generează și livrează bonul fiscal în format PDF (`GET /api/orders/:id/receipt.pdf`).

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| Mese, Ingrediente, Rețete | `data/restaurant.db` | SQLite (WAL mode) | Tabele relaționale pentru stocuri și compoziții |
| Comenzi și Plăți | `data/restaurant.db` | SQLite (WAL mode) | Înregistrări comenzi și plăți cu timestamp |
| Bonuri fiscale | `data/receipts/` | Server Core | Fișiere PDF generate la închiderea notei |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `PORT` | `.env` / Environment | Server Core | Portul HTTP (implicit 3000) |
| `DB_PATH` | `.env` / Environment | Database | Calea către fișierul SQLite |

## Build, deploy, runtime
- Runtime: Node.js (>= 18)
- Teste automate: `npm test` (verificare calcul autoritar pe server, scădere atomică a stocului).

## Boundaries
Boundary rules and contracts defined in `docs/agents/CONTRACTS.md`.
