/**
 * tests/availabilityService.test.js
 * Teste unitare pentru algoritmul de disponibilitate a serviciilor fracționate (Split Services),
 * interclasarea comenzilor scurte și prioritizarea pe KDS.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const AvailabilityService = require('../src/services/availabilityService');

describe('AvailabilityService - Algoritm Split Services și Interclasare', () => {

  it('1. Calculează corect intervalele libere scăzând intervalele ocupate', () => {
    // Schimb 10:00 - 14:00 (minutele 600 - 840)
    // Ocupat: 660-700 (11:00-11:40) și 750-780 (12:30-13:00)
    const busy = [
      { start: 660, end: 700 },
      { start: 750, end: 780 }
    ];
    const free = AvailabilityService.computeFreeIntervals(600, 840, busy);

    assert.deepEqual(free, [
      { start: 600, end: 660 },
      { start: 700, end: 750 },
      { start: 780, end: 840 }
    ]);
  });

  it('2. Acceptă programarea unui split service (20m activ + 30m pasiv + 15m activ) când ambele faze active sunt libere', () => {
    // Începem la minutul 600 (10:00).
    // Faza 1: [600, 620) -> trebuie să fie liber
    // Faza 2: [620, 650) -> pasiv (așteptare 30 min)
    // Faza 3: [650, 665) -> trebuie să fie liber
    const free = [
      { start: 600, end: 630 }, // acoperă [600, 620)
      { start: 645, end: 700 }  // acoperă [650, 665)
    ];

    const result = AvailabilityService.canBookSplitService(600, free, 840, {
      p1Duration: 20,
      minWait: 30,
      maxWait: 45,
      p3Duration: 15
    });

    assert.equal(result.available, true);
    assert.deepEqual(result.p1, { start: 600, end: 620 });
    assert.deepEqual(result.p3, { start: 650, end: 665 });
    assert.equal(result.waitMinutes, 30);
  });

  it('3. Respinge split service dacă Faza 1 se suprapune cu altă activitate a bucătarului', () => {
    const free = [
      { start: 610, end: 630 }, // începe la 610, deci [600, 620) NU încape
      { start: 645, end: 700 }
    ];

    const result = AvailabilityService.canBookSplitService(600, free, 840);
    assert.equal(result.available, false);
  });

  it('4. Utilizează fereastra de toleranță [30, 45] min dacă la exact 30 min Faza 3 este blocată, dar la 35 min este liberă', () => {
    // Faza 1: [600, 620)
    // La wait = 30 min -> P3 ar fi [650, 665) -> ocupat!
    // La wait = 35 min -> P3 ar fi [655, 670) -> liber!
    const free = [
      { start: 600, end: 630 },
      { start: 655, end: 700 } // minutul 650 este ocupat, dar de la 655 este liber!
    ];

    const result = AvailabilityService.canBookSplitService(600, free, 840, {
      p1Duration: 20,
      minWait: 30,
      maxWait: 45,
      p3Duration: 15,
      stepMinutes: 5
    });

    assert.equal(result.available, true);
    assert.deepEqual(result.p1, { start: 600, end: 620 });
    assert.deepEqual(result.p3, { start: 655, end: 670 });
    assert.equal(result.waitMinutes, 35);
  });

  it('5. Respinge dacă Faza 3 nu găsește niciun slot liber nici măcar la toleranța maximă de 45 min', () => {
    const free = [
      { start: 600, end: 630 }
      // Niciun interval liber ulterior
    ];

    const result = AvailabilityService.canBookSplitService(600, free, 840, {
      minWait: 30,
      maxWait: 45
    });

    assert.equal(result.available, false);
  });

  it('6. Interclasare: identifică sloturi pentru o comandă scurtă (25 min) în intervalul de așteptare [620, 650)', () => {
    const gapStart = 620;
    const gapEnd = 650; // fereastră de 30 min
    const duration = 25; // comandă scurtă de 25 min

    const slots = AvailabilityService.findShortServiceSlotsInGap(gapStart, gapEnd, duration, [], 5);
    // Potriviri posibile: [620, 645) și [625, 650)
    assert.equal(slots.length, 2);
    assert.deepEqual(slots[0], { start: 620, end: 645 });
    assert.deepEqual(slots[1], { start: 625, end: 650 });
  });

  it('7. Interclasare: comandă de 35 min este respinsă într-o fereastră fixă de 30 min', () => {
    const slots = AvailabilityService.findShortServiceSlotsInGap(620, 650, 35, []);
    assert.equal(slots.length, 0);
  });

  it('8. Prioritizare KDS (PATTERN-002 & PATTERN-003): comenzi critice (>15m) și în atenționare (10-15m) sunt escaladate prioritar', () => {
    const currentMinute = 100;
    const orders = [
      { id: 'ord-normal-recent', placed_at_minute: 98 }, // 2 min elapsed
      { id: 'ord-warn', placed_at_minute: 88 },          // 12 min elapsed (Warning > 10m)
      { id: 'ord-normal-older', placed_at_minute: 95 },  // 5 min elapsed
      { id: 'ord-critical', placed_at_minute: 82 }       // 18 min elapsed (Critical > 15m)
    ];

    const sorted = AvailabilityService.prioritizeKdsOrders(orders, currentMinute);

    assert.equal(sorted[0].id, 'ord-critical', 'Comanda critică (>15m) trebuie să fie prima');
    assert.equal(sorted[1].id, 'ord-warn', 'Comanda în atenționare (>10m) trebuie să fie a doua');
    assert.equal(sorted[2].id, 'ord-normal-older', 'Comanda normală mai veche trebuie să fie a treia (FIFO)');
    assert.equal(sorted[3].id, 'ord-normal-recent', 'Comanda recentă trebuie să fie ultima');
  });

  it('9. Alertă cromatică în două trepte (PATTERN-002): normal (<10m), atenționare (10-15m), critic (>15m)', () => {
    const now = 1000000;
    const normal = AvailabilityService.getKdsAlertStatus(now - 5 * 60000, now);
    assert.equal(normal.alertLevel, 'normal');
    assert.equal(normal.isDelayed, false);

    const warning = AvailabilityService.getKdsAlertStatus(now - 12 * 60000, now);
    assert.equal(warning.alertLevel, 'warning');
    assert.equal(warning.isDelayed, true);

    const critical = AvailabilityService.getKdsAlertStatus(now - 16 * 60000, now);
    assert.equal(critical.alertLevel, 'critical');
    assert.equal(critical.isDelayed, true);
  });

  it('10. Calcul dinamic al disponibilității preparatelor din stocul de ingrediente', () => {
    const dish = {
      id: 'ciorba_burta',
      name: 'Ciorbă de burtă',
      recipe: [
        { ingredient_id: 'burta_vita', quantity: 1, unit: 'porție' },
        { ingredient_id: 'smantana', quantity: 1, unit: 'cupă' },
        { ingredient_id: 'paine', quantity: 1, unit: 'coșuleț' }
      ]
    };

    // Cazul A: Toate ingredientele au stoc
    const stockOk = { burta_vita: 10, smantana: 5, paine: 8 };
    const resOk = AvailabilityService.calculateDishAvailability(dish, stockOk);
    assert.equal(resOk.is_available, true);
    assert.equal(resOk.max_portions, 5); // smantana are 5, deci minimul e 5

    // Cazul B: Burtă de vită are stoc 0
    const stockDepleted = { burta_vita: 0, smantana: 5, paine: 8 };
    const resDepleted = AvailabilityService.calculateDishAvailability(dish, stockDepleted);
    assert.equal(resDepleted.is_available, false);
    assert.equal(resDepleted.missing_ingredient_id, 'burta_vita');
    assert.equal(resDepleted.max_portions, 0);
  });
});
