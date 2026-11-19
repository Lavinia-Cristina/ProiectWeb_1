/**
 * src/services/availabilityService.js
 * Algoritmul de disponibilitate pentru servicii fracționate (split services)
 * și interclasarea comenzilor scurte în bucătărie / sală - Restaurant Kon Tiki.
 * 
 * Obey: PATTERN-002, PATTERN-003, CONTEXT.md
 */

class AvailabilityService {
  /**
   * Verifică dacă două intervale semi-deschise [aStart, aEnd) și [bStart, bEnd) se suprapun.
   * @param {number} aStart 
   * @param {number} aEnd 
   * @param {number} bStart 
   * @param {number} bEnd 
   * @returns {boolean}
   */
  static intervalsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  /**
   * Calculează intervalele libere dintr-un orizont [shiftStart, shiftEnd)
   * scăzând mulțimea intervalelor ocupate.
   * @param {number} shiftStart - minutul de start al schimbului (ex. 600 = 10:00)
   * @param {number} shiftEnd - minutul de final al schimbului (ex. 1320 = 22:00)
   * @param {Array<{start: number, end: number}>} busyList - intervale ocupate
   * @returns {Array<{start: number, end: number}>} intervale libere ordonate și disjuncte
   */
  static computeFreeIntervals(shiftStart, shiftEnd, busyList = []) {
    if (!busyList || busyList.length === 0) {
      return [{ start: shiftStart, end: shiftEnd }];
    }

    // Clonare și sortare după start
    const sorted = [...busyList].sort((a, b) => a.start - b.start);
    const merged = [];

    for (const cur of sorted) {
      // Ignoră intervale în afara orizontului
      if (cur.end <= shiftStart || cur.start >= shiftEnd) continue;

      const clippedStart = Math.max(shiftStart, cur.start);
      const clippedEnd = Math.min(shiftEnd, cur.end);

      if (merged.length === 0) {
        merged.push({ start: clippedStart, end: clippedEnd });
      } else {
        const last = merged[merged.length - 1];
        if (clippedStart <= last.end) {
          last.end = Math.max(last.end, clippedEnd);
        } else {
          merged.push({ start: clippedStart, end: clippedEnd });
        }
      }
    }

    const free = [];
    let current = shiftStart;

    for (const b of merged) {
      if (b.start > current) {
        free.push({ start: current, end: b.start });
      }
      current = Math.max(current, b.end);
    }

    if (current < shiftEnd) {
      free.push({ start: current, end: shiftEnd });
    }

    return free;
  }

  /**
   * Verifică dacă intervalul [start, end) este complet conținut în cel puțin un interval liber.
   * @param {number} start 
   * @param {number} end 
   * @param {Array<{start: number, end: number}>} freeIntervals 
   * @returns {boolean}
   */
  static isContainedInFree(start, end, freeIntervals) {
    if (start >= end) return false;
    return freeIntervals.some(f => f.start <= start && end <= f.end);
  }

  /**
   * Evaluează dacă un serviciu fracționat poate fi programat la candidateStart
   * luând în calcul fereastra de toleranță [minWait, maxWait] pentru faza pasivă.
   * 
   * Configurație standard Kon Tiki:
   * - Faza 1: 20 min activ (preparare bucătar / servire)
   * - Faza 2: pasivă / așteptare cu toleranță [30, 45] min
   * - Faza 3: 15 min activ (montare farfurie / finisare)
   * 
   * @param {number} candidateStart - minutul de început propus
   * @param {Array<{start: number, end: number}>} freeIntervals - intervale libere ale resursei
   * @param {number} shiftEnd - limita maximă a programului
   * @param {object} options
   * @returns {{ available: boolean, p1: {start: number, end: number}, p3: {start: number, end: number}|null, waitMinutes: number }}
   */
  static canBookSplitService(candidateStart, freeIntervals, shiftEnd, options = {}) {
    const p1Duration = options.p1Duration || 20;
    const minWait = options.minWait !== undefined ? options.minWait : 30;
    const maxWait = options.maxWait !== undefined ? options.maxWait : 45;
    const p3Duration = options.p3Duration || 15;
    const stepMinutes = options.stepMinutes || 5;

    const p1 = { start: candidateStart, end: candidateStart + p1Duration };

    // 1. Verifică disponibilitatea Fazei 1
    if (!this.isContainedInFree(p1.start, p1.end, freeIntervals)) {
      return { available: false, p1, p3: null, waitMinutes: 0 };
    }

    // 2. Caută prima valoare validă de timp de așteptare în fereastra [minWait, maxWait]
    // pentru care Faza 3 este complet liberă și nu depășește shiftEnd
    for (let wait = minWait; wait <= maxWait; wait += stepMinutes) {
      const p3Start = p1.end + wait;
      const p3End = p3Start + p3Duration;

      if (p3End <= shiftEnd && this.isContainedInFree(p3Start, p3End, freeIntervals)) {
        return {
          available: true,
          p1,
          p3: { start: p3Start, end: p3End },
          waitMinutes: wait
        };
      }
    }

    return { available: false, p1, p3: null, waitMinutes: 0 };
  }

  /**
   * Identifică toate sloturile valide pentru o comandă scurtă (ex. 10m, 15m, 25m)
   * care pot fi interclasate în timpul fazei de așteptare [gapStart, gapEnd).
   * 
   * @param {number} gapStart - începutul ferestrei pasive
   * @param {number} gapEnd - sfârșitul ferestrei pasive
   * @param {number} durationMinutes - durata comenzii scurte
   * @param {Array<{start: number, end: number}>} busyIntervals - intervale ocupate
   * @param {number} stepMinutes - pasul de discretizare (implicit 5 min)
   * @returns {Array<{start: number, end: number}>}
   */
  static findShortServiceSlotsInGap(gapStart, gapEnd, durationMinutes, busyIntervals = [], stepMinutes = 5) {
    const validSlots = [];
    if (gapEnd - gapStart < durationMinutes) {
      return validSlots;
    }

    for (let t = gapStart; t + durationMinutes <= gapEnd; t += stepMinutes) {
      const slotEnd = t + durationMinutes;
      const hasConflict = busyIntervals.some(b => this.intervalsOverlap(t, slotEnd, b.start, b.end));
      if (!hasConflict) {
        validSlots.push({ start: t, end: slotEnd });
      }
    }

    return validSlots;
  }

  /**
   * Calculul dinamic al disponibilității preparatelor din stocul de ingrediente.
   * Conform regulilor de business Kon Tiki:
   * - Meniul reflectă disponibilitatea în timp real.
   * - Un preparat este disponibil dacă și numai dacă pentru fiecare ingredient din rețetă
   *   avem stoc curent >= cantitate cerută.
   * 
   * @param {object} dish - obiectul preparat { id, name, recipe: [{ ingredient_id, quantity, unit }] }
   * @param {object} stockMap - dicționar { ingredient_id: current_stock }
   * @returns {{ is_available: boolean, missing_ingredient_id: string|null, max_portions: number }}
   */
  static calculateDishAvailability(dish, stockMap = {}) {
    if (!dish.recipe || dish.recipe.length === 0) {
      return { is_available: true, missing_ingredient_id: null, max_portions: Infinity };
    }

    let minPortions = Infinity;
    for (const item of dish.recipe) {
      const availableStock = stockMap[item.ingredient_id] !== undefined ? stockMap[item.ingredient_id] : 0;
      if (availableStock < item.quantity) {
        return {
          is_available: false,
          missing_ingredient_id: item.ingredient_id,
          max_portions: 0
        };
      }
      const portionsForThisItem = Math.floor(availableStock / item.quantity);
      if (portionsForThisItem < minPortions) {
        minPortions = portionsForThisItem;
      }
    }

    return {
      is_available: true,
      missing_ingredient_id: null,
      max_portions: minPortions === Infinity ? 0 : minPortions
    };
  }

  /**
   * Determină starea de alertă cromatică pentru o comandă pe KDS (PATTERN-002):
   * - normal: sub 10 minute
   * - atenționare (galben/portocaliu): între 10 și 15 minute
   * - critic / întârziată (roșu): peste 15 minute
   * 
   * @param {number} placedAtMs - timestamp-ul plasării în milisecunde
   * @param {number} nowMs - timestamp-ul curent în milisecunde
   * @returns {{ elapsedMinutes: number, alertLevel: 'normal'|'warning'|'critical', isDelayed: boolean }}
   */
  static getKdsAlertStatus(placedAtMs, nowMs = Date.now()) {
    const elapsedMinutes = Math.floor((nowMs - placedAtMs) / 60000);
    let alertLevel = 'normal';
    let isDelayed = false;

    if (elapsedMinutes >= 15) {
      alertLevel = 'critical';
      isDelayed = true;
    } else if (elapsedMinutes >= 10) {
      alertLevel = 'warning';
      isDelayed = true;
    }

    return { elapsedMinutes, alertLevel, isDelayed };
  }

  /**
   * Sortează tichetele de pe Kitchen Display System (KDS) respectând fluxul continuu
   * de preparare (maxim 15 minute) cu auto-escaladare (PATTERN-002, PATTERN-003):
   * 1. Prioritate 1: Comenzi critice care au depășit 15 minute (roșu)
   * 2. Prioritate 2: Comenzi aflate în atenționare între 10 și 15 minute (galben/portocaliu)
   * 3. Prioritate 3: Comenzi normale ordonate FIFO (cele mai vechi primele)
   * 
   * @param {Array<object>} orders 
   * @param {number} currentMinute 
   * @returns {Array<object>}
   */
  static prioritizeKdsOrders(orders, currentMinute) {
    return [...orders].sort((a, b) => {
      const aElapsed = currentMinute - (a.placed_at_minute || currentMinute);
      const bElapsed = currentMinute - (b.placed_at_minute || currentMinute);

      const aLevel = aElapsed >= 15 ? 2 : (aElapsed >= 10 ? 1 : 0);
      const bLevel = bElapsed >= 15 ? 2 : (bElapsed >= 10 ? 1 : 0);

      // Comenzile cu nivel de întârziere mai mare sunt primele
      if (aLevel !== bLevel) {
        return bLevel - aLevel;
      }

      // La același nivel de alertă, ordonăm FIFO (cea mai veche plasată prima)
      return (a.placed_at_minute || 0) - (b.placed_at_minute || 0);
    });
  }
}

module.exports = AvailabilityService;
