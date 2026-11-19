/**
 * tests/securityAndValidation.test.js
 * Teste automate pentru verificarea corectitudinii remediilor de securitate,
 * validare pe server și prevenire a anomaliilor de stare.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const RestaurantDB = require('../src/db/database');
const seedDatabase = require('../src/db/seed');
const app = require('../src/server');

const TEST_DB = path.join(__dirname, 'test_sec_validation.db');
let db;
let server;
let baseUrl;

describe('Security & Input Validation Tests', () => {
  before(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    seedDatabase(TEST_DB);
    db = new RestaurantDB(TEST_DB);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (db) db.close();
    if (server) server.close();
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
  });

  it('1. Respinge număr de masă invalid sau non-integer la plasarea comenzii', () => {
    assert.throws(() => {
      db.placeOrderAtomic({
        table_number: 2.5,
        items: [{ dish_id: 'ciorba_burta', quantity: 1 }]
      });
    }, /Număr masă invalid/);

    assert.throws(() => {
      db.placeOrderAtomic({
        table_number: 13,
        items: [{ dish_id: 'ciorba_burta', quantity: 1 }]
      });
    }, /Număr masă invalid/);
  });

  it('2. Respinge cantități invalide (negative, zero, non-integer) sau opțiuni extra duplicate', () => {
    assert.throws(() => {
      db.placeOrderAtomic({
        table_number: 1,
        items: [{ dish_id: 'ciorba_burta', quantity: -2 }]
      });
    }, /Cantitate invalidă/);

    assert.throws(() => {
      db.placeOrderAtomic({
        table_number: 1,
        items: [{ dish_id: 'ciorba_burta', quantity: 1, extras: ['extra_smantana', 'extra_smantana'] }]
      });
    }, /Opțiunile extra duplicate nu sunt permise/);
  });

  it('3. Interzice trecerea unei comenzi direct în starea "achitată" prin POST /api/orders/:id/status', async () => {
    // Plasare comandă validă
    const order = db.placeOrderAtomic({
      table_number: 5,
      items: [{ dish_id: 'ciorba_burta', quantity: 1 }]
    });

    const res = await fetch(`${baseUrl}/api/orders/${order.order_id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'achitată' })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /doar prin încasarea la casă/);
  });

  it('4. Respinge tentativele de Path Traversal pe endpoint-ul de bonuri PDF', async () => {
    const res = await fetch(`${baseUrl}/api/receipts/..%2f..%2fpackage.json`);
    assert.equal(res.status, 400);
  });

  it('5. Respinge valori invalide la aprovizionarea stocului (restock)', () => {
    assert.throws(() => {
      db.restockIngredient('paine', -5);
    }, /Cantitate invalidă/);

    assert.throws(() => {
      db.restockIngredient('paine', Infinity);
    }, /Cantitate invalidă/);
  });
});
