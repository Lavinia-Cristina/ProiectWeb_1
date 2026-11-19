/**
 * tests/apiIntegration.test.js
 * Teste de integrare end-to-end pentru serverul Express Restaurant Kon Tiki:
 * - Verificare rute REST (mese, meniu, comenzi, încasări, admin)
 * - Verificare generare PDF bon fiscal (D-005)
 * - Verificare generare coduri QR (D-005)
 * - Verificare rutare SSE (D-002)
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../src/server');
const seedDatabase = require('../src/db/seed');

describe('API Integration & End-to-End Tests (D-001, D-002, D-004, D-005, D-006)', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 3199;

  before(async () => {
    // Re-seed date de pornire
    seedDatabase();

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        baseUrl = `http://localhost:${TEST_PORT}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. GET /api/tables returnează exact 12 mese inițializate cu status "liberă"', async () => {
    const res = await fetch(`${baseUrl}/api/tables`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.tables.length, 12);
    assert.equal(data.tables[0].table_number, 1);
    assert.equal(data.tables[11].table_number, 12);
  });

  it('2. GET /api/menu returnează preparatele și disponibilitatea calculată dinamic', async () => {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.menu.length >= 20); // Meniul complet real
    const burta = data.menu.find(d => d.id === 'ciorba_burta');
    assert.ok(burta);
    assert.equal(burta.price, 24);
    assert.equal(burta.weight, '100/300g');
    assert.equal(burta.is_available, true);
    assert.ok(burta.max_portions > 0);
  });

  it('3. POST /api/orders plasează comanda atomic cu preț autoritar pe server (D-004)', async () => {
    const payload = {
      table_number: 3,
      items: [
        { dish_id: 'ciorba_burta', quantity: 2, extras: ['extra_smantana'] }
      ],
      client_supplied_price: 5.00 // Încercare fraudă - ignorat autoritar
    };

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.table_number, 3);
    // 2 x (24 + 4) = 56 lei
    assert.equal(data.order.total_price, 56.00);

    // Masa 3 a devenit ocupată
    const resTable = await fetch(`${baseUrl}/api/tables`);
    const tablesData = await resTable.json();
    const t3 = tablesData.tables.find(t => t.table_number === 3);
    assert.equal(t3.status, 'ocupată');
  });

  it('4. POST /api/orders/:id/status actualizează stadiul comenzii (plasată -> în preparare -> gata)', async () => {
    // Plasare comandă masă 5
    const ordRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: 5,
        items: [{ dish_id: 'cartofi_branza', quantity: 1, extras: [] }]
      })
    });
    const ordData = await ordRes.json();
    const orderId = ordData.order.order_id;

    // Trecere în preparare
    const resPrep = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'în preparare' })
    });
    const prepData = await resPrep.json();
    assert.equal(prepData.order.status, 'în preparare');

    // Trecere în gata
    const resGata = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'gata' })
    });
    const gataData = await resGata.json();
    assert.equal(gataData.order.status, 'gata');
    assert.ok(gataData.order.ready_at > 0);
  });

  it('5. POST /api/payments încasează consumul cumulativ și generează bonul fiscal PDF (D-005, D-006)', async () => {
    // Încasare masa 3 (avea comanda de 56 lei plasată anterior)
    const payRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: 3,
        payment_method: 'Card'
      })
    });

    assert.equal(payRes.status, 201);
    const payData = await payRes.json();
    assert.equal(payData.success, true);
    assert.equal(payData.payment.table_number, 3);
    assert.equal(payData.payment.payment_method, 'Card');
    assert.equal(payData.payment.total_amount, 56.00);
    assert.ok(payData.pdf_url.startsWith('/receipts/bon_'));

    // Verificare că fișierul PDF chiar a fost scris pe disc și este un document PDF valid (%PDF)
    const pdfPath = path.join(__dirname, '../data/receipts', payData.payment.pdf_receipt_path);
    assert.ok(fs.existsSync(pdfPath), `Fișierul PDF ${pdfPath} ar trebui să existe pe disc.`);
    const pdfBytes = fs.readFileSync(pdfPath);
    assert.ok(pdfBytes.length > 500);
    assert.equal(pdfBytes.subarray(0, 4).toString(), '%PDF');

    // Masa 3 s-a eliberat automat
    const resTable = await fetch(`${baseUrl}/api/tables`);
    const tablesData = await resTable.json();
    const t3 = tablesData.tables.find(t => t.table_number === 3);
    assert.equal(t3.status, 'liberă');
  });

  it('6. GET /api/qr/:table_number generează codul QR server-side (D-005)', async () => {
    const res = await fetch(`${baseUrl}/api/qr/4`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.table_number, 4);
    assert.ok(data.qr_data_url.startsWith('data:image/png;base64,'));
  });

  it('7. GET /api/admin/inventory și POST /api/admin/restock funcționează corect', async () => {
    const resInv = await fetch(`${baseUrl}/api/admin/inventory`);
    const dataInv = await resInv.json();
    assert.equal(dataInv.success, true);
    assert.equal(dataInv.inventory.length, 21);

    const burtaBefore = dataInv.inventory.find(i => i.id === 'burta_vita').current_stock;

    // Aprovizionare cu 15 porții
    const resRestock = await fetch(`${baseUrl}/api/admin/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient_id: 'burta_vita', quantity: 15 })
    });
    const restockData = await resRestock.json();
    assert.equal(restockData.success, true);
    assert.equal(restockData.ingredient.current_stock, burtaBefore + 15);
  });

  it('8. GET /api/events se conectează cu text/event-stream pentru actualizări în timp real fără polling (D-002)', async () => {
    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/api/events`, { signal: controller.signal });
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/event-stream'));
    controller.abort();
  });
});
