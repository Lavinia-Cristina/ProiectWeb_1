# DESIGN — ProiectWeb_1 (Restaurant Kon Tiki)

<!-- graffino-agentic:begin v1 -->
> The design guardrails for this app. Every UI change follows them. A change to a
> token or a rule here is a PROPOSAL (AGENTS.md → The gate).

## Where designs live
**Designs change only in this repo.** A new or changed screen is drawn here, in
Claude Code or Antigravity, as a mock in `mocks/<DS-id>.html` (using the tokens below), and
confirmed before it is built. The places:

| Place | Role | Updated |
|---|---|---|
| `docs/design/` (this repo) | the source: tokens, mocks, screenshots, registry | in the repo |
| Design board (Source) | where people look at a design and confirm it | published from the repo, one way; never edited, never pulled back |
| Figma (Source, optional) | a snapshot for specific cases | regenerated only on request; can be behind |

When they disagree, the repo is right. A change made on the board or in Figma is lost
at the next publish. Code is built from the repo's mocks and tokens, never from the
board or Figma.

## Procedure for any UI change

1. **Find the design.** Resolve the screen's `DS-` ID in `registry.yaml` and open
   its mock (`mocks/`) and screenshots (`screens/`). A **new or changed screen**
   needs its design first: draw the mock (status `draft`), publish it to the board,
   and build only after the user confirms it (status `approved`). Never extrapolate a screen.
2. **Reuse first.** Use an existing component from `registry.yaml` (kind
   `component`). A new component needs a reason in the plan.
3. **Tokens only.** Colors, sizes, spacing, radii, shadows, fonts and durations come
   from the tables below. No raw hex, px or font name in component code.
4. **Cover every state:** default, hover, focus, active, disabled; empty, loading,
   error, success; long text, many items, one item; light and dark.
5. **Screenshot and compare** (command in AGENTS.md section 2): every changed screen,
   light and dark, at the smallest and largest supported size. Save as
   `screens/<DS-id>.<light|dark>.png`. Look at each one before you report.
6. **Record.** Update `registry.yaml` (new DS- ID, status `implemented`, source
   file). Republish the changed screens to the board. A reusable UI practice becomes
   a `candidate` pattern.

## Guardrails

**Color and contrast**
- Text contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 18.66 px bold / 24 px). Icons, borders of
   inputs and focus rings ≥ 3:1 against their background. Check both themes.
- Color never carries meaning alone: pair it with an icon or text.
- Dark mode uses its own token values, not inverted light values.

**Layout and spacing**
- Spacing comes from the scale only. Align to the grid; equal gaps for equal
   relationships.
- No horizontal scroll at the smallest supported width. Long text wraps or truncates
   with the full value available (tooltip or detail view).

**Typography**
- Only the type scale below. One primary heading per screen. Sentence case for
   labels, buttons and headings.

**Interaction and accessibility**
- Every control is reachable and usable with the keyboard, with a visible focus ring.
- Hit targets ≥ 44 × 44 px on touch, ≥ 24 × 24 px with a pointer.
- Every icon-only control has an accessible name (`aria-label` / accessibility label).
- Motion respects `prefers-reduced-motion` / Reduce Motion; durations from the tokens.

**Copy**
- Plain, short, active voice. Buttons name the action ("Install", not "OK").
- Error text says what happened and what to do next. No raw error codes alone.
- Terms from `CONTEXT.md` only.

**States**
- Empty states explain what will appear and offer the next action.
- Loading shows within 100 ms of a wait; skeletons keep the final layout.
- Destructive actions ask for confirmation or offer undo.

## Publishing to the board
Say **"publish the board"**. Publishing goes one way, repo → board; nothing is
pulled back.

<!-- graffino-agentic:end -->

## Source
- Identitate vizuală: Restaurant Kon Tiki (Sibiu) — atmosferă rustică, autentică, bazată pe meniul alb curat și tonuri neutre calde.
- Design board: none yet (published from `mocks/`, never pulled)
- Figma: none (regenerated on request)

---

## Tokens (Propuși pentru Kon Tiki)

### Color (Neutre Moderne & Accente Rustice)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#faf8f5` | `#181614` | Fundal pagină (alb cald tip hârtie de meniu / cărbune lemnos închis) |
| `--color-surface` | `#ffffff` | `#23201d` | Carduri preparate, tichete comenzi, panouri modale |
| `--color-surface-subtle` | `#f2eee9` | `#2d2925` | Fundal subtil pentru ingrediente, selecții, badge-uri neutre |
| `--color-border` | `#e2dcd4` | `#3d3731` | Linii despărțitoare, margini carduri și input-uri |
| `--color-text` | `#241e19` | `#f4eee7` | Text principal (contrast ridicat, nuanță cărbune/cafea prăjită) |
| `--color-text-muted` | `#6e645a` | `#aba095` | Text secundar, descrieri, etichete detalii (contrast ≥ 4.5:1) |
| `--color-primary` | `#8c3a1e` | `#e07a52` | Butoane acțiune principală, accente rustice cărămizii / teracotă |
| `--color-primary-hover` | `#732f18` | `#ea8e69` | Stare hover/active buton primar |
| `--color-secondary` | `#4a5548` | `#889c84` | Accente secundare neutre-vegetale (verde măslină / salvie) |
| `--color-accent` | `#c97a2b` | `#df9547` | Accente calde (chihlimbar / auriu cald) pentru prețuri și atenționări |
| `--color-success` | `#2d6a4f` | `#52b788` | Stare preparat disponibil / comanda marcată ca „Gata” |
| `--color-warning` | `#b45309` | `#fbbf24` | Alertă vizuală pentru comandă întârziată (>10-15 min) |
| `--color-danger` | `#b91c1c` | `#f87171` | Stare preparat indisponibil (stoc epuizat) / erori sistem |

### Typography (Combinație Serif Tradițional + Sans-Serif Modern)
| Token | Family | Size / Line height | Weight | Use |
|---|---|---|---|---|
| `--font-heading` | `'Merriweather', 'Lora', Georgia, serif` | 30px / 1.25 | 700 | Titlu principal ecran (ex. „Kon Tiki — Meniu Digital”) |
| `--font-subheading` | `'Merriweather', 'Lora', Georgia, serif` | 22px / 1.3 | 600 | Categorii meniu, titluri de secțiuni |
| `--font-dish-title` | `'Merriweather', 'Lora', Georgia, serif` | 18px / 1.35 | 600 | Denumiri preparate (ex. „Ciorbă de burtă”) |
| `--font-sans` | `'Inter', system-ui, sans-serif` | 16px / 1.5 | 400 | Text general conținut, descrieri preparate |
| `--font-sans-bold` | `'Inter', system-ui, sans-serif` | 16px / 1.5 | 600 | Prețuri, etichete butoane, roluri |
| `--font-sans-sm` | `'Inter', system-ui, sans-serif` | 14px / 1.4 | 400 | Ingrediente rețetă, opțiuni extra |
| `--font-sans-xs` | `'Inter', system-ui, sans-serif` | 12px / 1.3 | 500 | Badge-uri alergeni, stoc disponibil, cronometru KDS |

### Spacing (Scară de 8px / bază 4px)
| Token | Value | Use |
|---|---|---|
| `--space-2xs` | 4px | Spațiere compactă între tag-uri, padding badge-uri |
| `--space-xs` | 8px | Spațiu între etichetă și input, icon și text |
| `--space-sm` | 12px | Padding intern butoane mici, spațiere listă ingrediente |
| `--space-md` | 16px | Padding intern carduri preparate, spațiere standard grile |
| `--space-lg` | 24px | Distanță între secțiuni, margini containere mobile |
| `--space-xl` | 32px | Distanță între categorii mari de meniu |
| `--space-2xl` | 48px | Spațiere antet și separatori majori ecran |

### Radius, Shadow & Motion
| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | Badge-uri mici (alergeni, număr masă) |
| `--radius-md` | 8px | Butoane acțiune, câmpuri formular, tichete bucătărie |
| `--radius-lg` | 12px | Carduri preparate, ferestre modale, panou încasare |
| `--radius-full` | 9999px | Selector rotunjit pentru cele 12 mese, indicatori stare |
| `--shadow-card` | `0 2px 8px rgba(36, 30, 25, 0.06)` | Umbră caldă discretă pe fundal deschis |
| `--shadow-modal` | `0 12px 28px rgba(36, 30, 25, 0.16)` | Umbră ferestre modale și meniuri flotante |
| `--transition-fast` | `150ms ease-in-out` | Tranziții hover butoane, schimbare stare |
| `--transition-normal` | `250ms ease-in-out` | Desfășurare detalii preparat, afișare modală |

### Breakpoints
| Name | Min | Max | Target |
|---|---|---|---|
| `mobile` | 320px | 767px | Ecran Client QR (optimizat pentru smartphone la masă) |
| `tablet` | 768px | 1024px | Ecran Ospătar (tabletă de sală) / Ecran Casă |
| `desktop` | 1025px | — | Kitchen Display System (KDS Bucătărie) & Monitor Sală |
