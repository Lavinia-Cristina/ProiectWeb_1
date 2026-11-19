# Patterns — ProiectWeb_1

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Rutare directă pe roluri fără autentificare blocantă · candidate
- PATTERN-002 · Alertă cromatică în două trepte pentru comenzi la bucătărie · candidate
- PATTERN-003 · Flux continuu de preparare în maxim 15 minute cu auto-escaladare pe KDS · candidate

---

## PATTERN-001 · Rutare directă pe roluri fără autentificare blocantă
- **Status:** candidate
- **How:** Fiecare ecran funcțional este accesibil direct printr-un URL dedicat (`/menu`, `/order-status`, `/waiter`, `/kds`, `/cashier`, `/admin`, `/monitor`), fără formulare de login cu sesiuni care pot expira în timpul unei demonstrații academice.
- **Example:** Rute statice Express (`app.use('/kds', ...)`), cu selector rapid de masă sau rol direct în interfață.

## PATTERN-002 · Alertă cromatică în două trepte pentru comenzi la bucătărie
- **Status:** candidate
- **How:** Timpul de preparare este cronometrat dinamic din timestamp-ul plasării (`placed_at`); la depășirea a 10 minute tichetul devine galben/portocaliu (atenționare), iar la depășirea a 15 minute devine roșu aprins (critic).
- **Example:** `const isWarning = elapsed >= 10 && elapsed < 15; const isCritical = elapsed >= 15;`

## PATTERN-003 · Flux continuu de preparare în maxim 15 minute cu auto-escaladare pe KDS
- **Status:** candidate
- **How:** Mâncarea se prepară în flux continuu în bucătărie în maximum 15 minute, fără timpi morți sau pauze pasive. Pe ecranul KDS, tichetele sunt ordonate automat prin auto-escaladare: comenzile care depășesc 15 minute (critice) și cele aflate în atenționare (10–15 minute) sunt mutate prioritar la începutul liniei pentru a fi finalizate imediat de bucătar.
- **Example:** `AvailabilityService.prioritizeKdsOrders(orders, currentMinute)`
