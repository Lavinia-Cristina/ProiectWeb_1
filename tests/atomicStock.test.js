/**
 * tests/atomicStock.test.js
 * Teste de integritate tranzacțională ACID pentru Restaurant Kon Tiki:
 * - Calcul autoritar al prețurilor pe server (D-004) și test anti-manipulare
 * - Gestiune atomică a stocului (all-or-nothing)
 * - Garanția matematică anti double-booking ("No slot can ever be booked twice")
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const RestaurantDB = require('../src/db/database');
const seedDatabase = require('../src/db/seed');

const TEST_DB_PATH = path.join(__dirname, '../data/test_restaurant.db');

describe('Database & Tranzacționalitate ACID (D-004, D-006, Anti Double-Booking)', () => {
  let dbWrapper;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    seedDatabase(TEST_DB_PATH);
    dbWrapper = new RestaurantDB(TEST_DB_PATH);
  });

  afterEach(() => {
    if (dbWrapper) {
      dbWrapper.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
  });

  it('1. Test Anti-Manipulare Preț Server (D-004): Totalul este calculat strict de server ignorând datele din client', () => {
    // Clientul încearcă să trimită un preț fraudat de 1.00 leu pentru Ciorbă de burtă (24 lei în meniul real) + Smântână în plus (4 lei)
    const fraudOrderPayload = {
      table_number: 4,
      items: [
        {
          dish_id: 'ciorba_burta',
          quantity: 1,
          extras: ['extra_smantana']
        }
      ],
      client_supplied_price: 1.00 // Tentativă de fraudă din frontend
    };

    const confirmedOrder = dbWrapper.placeOrderAtomic(fraudOrderPayload);

    // Verificare autoritară: 24 + 4 = 28 lei, prețul de 1.00 leu a fost complet ignorat
    assert.equal(confirmedOrder.total_price, 28.00);

    // Verificare persistență în baza de date
    const row = dbWrapper.db.prepare('SELECT total_price FROM orders WHERE id = ?').get(confirmedOrder.order_id);
    assert.equal(row.total_price, 28.00);
  });

  it('2. Decrementare atomică a stocului pe ingrediente (rețetă + extra)', () => {
    const stockBefore = dbWrapper.getStockMap();
    const initialBurta = stockBefore['burta_vita']; // 40
    const initialSmantana = stockBefore['smantana']; // 100
    const initialPaine = stockBefore['paine']; // 50

    // Comandăm 2 x Ciorbă de burtă cu extra smântână per porție:
    // consumă 2 burtă, 2 * (1 rețetă + 1 extra) = 4 smântână, 2 pâine
    dbWrapper.placeOrderAtomic({
      table_number: 2,
      items: [
        {
          dish_id: 'ciorba_burta',
          quantity: 2,
          extras: ['extra_smantana']
        }
      ]
    });

    const stockAfter = dbWrapper.getStockMap();
    assert.equal(stockAfter['burta_vita'], initialBurta - 2);
    assert.equal(stockAfter['smantana'], initialSmantana - 4);
    assert.equal(stockAfter['paine'], initialPaine - 2);
  });

  it('3. Totul sau nimic (All-or-Nothing): Comanda cu stoc parțial insuficient este respinsă fără a altera stocul existent', () => {
    // Setăm stocul de carne de vită la exact 1 porție
    dbWrapper.db.prepare("UPDATE ingredients SET current_stock = 1 WHERE id = 'carne_vita'").run();

    const stockBefore = dbWrapper.getStockMap();

    // Clientul comandă 2 ciorbe de văcuță (necesită 2 porții carne_vita, avem doar 1)
    assert.throws(() => {
      dbWrapper.placeOrderAtomic({
        table_number: 3,
        items: [
          {
            dish_id: 'ciorba_vacuta',
            quantity: 2
          }
        ]
      });
    }, /Stoc insuficient/);

    // Asigurăm că tranzacția a făcut ROLLBACK: stocul de carne și legume nu a scăzut deloc!
    const stockAfter = dbWrapper.getStockMap();
    assert.equal(stockAfter['carne_vita'], 1, 'Carnea de vită a rămas neschimbată');
    assert.equal(stockAfter['mix_legume'], stockBefore['mix_legume'], 'Legumele au rămas neschimbate');
  });

  it('4. Zero Double-Booking Guarantee: Niciun slot nu poate fi programat de două ori pe aceeași resursă', () => {
    const resourceType = 'staff';
    const resourceId = 'bucatar-sef';

    // Rezervare 1: Split service la minutul 600 (Faza 1: 600-620, Faza 2: 620-650, Faza 3: 650-665)
    const booking1 = dbWrapper.bookSplitServiceAtomic({
      resource_type: resourceType,
      resource_id: resourceId,
      candidate_start_minute: 600,
      order_id: 'ord-1'
    });

    assert.equal(booking1.booked, true);
    assert.deepEqual(booking1.p1, { start: 600, end: 620 });
    assert.deepEqual(booking1.p3, { start: 650, end: 665 });

    // Tentativă Rezervare 2 pe EXACT același slot de început (600) -> trebuie să fie REFUZATĂ!
    assert.throws(() => {
      dbWrapper.bookSplitServiceAtomic({
        resource_type: resourceType,
        resource_id: resourceId,
        candidate_start_minute: 600,
        order_id: 'ord-2'
      });
    }, /Conflict de programare/);

    // Tentativă Rezervare 3 ce se suprapune cu Faza 3 (ex. la minutul 640 -> Faza 1 ar fi 640-660, se suprapune peste 650-665) -> REFUZATĂ!
    assert.throws(() => {
      dbWrapper.bookSplitServiceAtomic({
        resource_type: resourceType,
        resource_id: resourceId,
        candidate_start_minute: 640,
        order_id: 'ord-3'
      });
    }, /Conflict de programare/);

    // Rezervare 4: Reușește în fereastra eliberată după Faza 3 (la minutul 670)
    const booking4 = dbWrapper.bookSplitServiceAtomic({
      resource_type: resourceType,
      resource_id: resourceId,
      candidate_start_minute: 670,
      order_id: 'ord-4'
    });
    assert.equal(booking4.booked, true);
    assert.deepEqual(booking4.p1, { start: 670, end: 690 });
  });

  it('5. Actualizare dinamică a disponibilității meniului pe baza stocului', () => {
    // Inițial ciorba de văcuță este disponibilă
    let menu = dbWrapper.getMenuWithAvailability();
    let vacuta = menu.find(d => d.id === 'ciorba_vacuta');
    assert.equal(vacuta.is_available, true);

    // Golim complet stocul de carne_vita
    dbWrapper.db.prepare("UPDATE ingredients SET current_stock = 0 WHERE id = 'carne_vita'").run();

    // Verificăm din nou meniul: ciorba de văcuță trebuie să devină instant INDISPONIBILĂ
    menu = dbWrapper.getMenuWithAvailability();
    vacuta = menu.find(d => d.id === 'ciorba_vacuta');
    assert.equal(vacuta.is_available, false);
    assert.equal(vacuta.max_portions, 0);

    // Ciorba de burtă trebuie să rămână în continuare DISPONIBILĂ (are burtă și smântână)
    const burta = menu.find(d => d.id === 'ciorba_burta');
    assert.equal(burta.is_available, true);
  });
});
