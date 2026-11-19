/**
 * src/server.js
 * Serverul principal Express pentru Restaurant Kon Tiki (P02 - 12 Mese).
 * 
 * Implementează:
 * - D-001: Node.js și Express pentru backend
 * - D-002: SSE pentru actualizări în timp real fără polling
 * - D-004: Calcul autoritar al prețurilor pe server și protecție anti-fraudă
 * - D-005: Generare server-side QR codes și bonuri fiscale PDF
 * - D-006: Consum cumulativ pe masă și bon fiscal unic la încasare
 * - PATTERN-001: Rutare directă fără formulare blocante de autentificare
 * - PATTERN-002 & PATTERN-003: Alerte KDS în 2 trepte și prioritizare comenzi
 */

const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const RestaurantDB = require('./db/database');
const seedDatabase = require('./db/seed');
const sseHub = require('./realtime/sse');
const QRService = require('./services/qrService');
const PDFService = require('./services/pdfService');
const AllergenService = require('./services/allergenService');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/restaurant.db');

// Inițializare bază de date
const db = new RestaurantDB(DB_PATH);

// Helper autoritar pentru determinarea domeniului de bază (protecție împotriva Host Header Injection)
function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const host = req.get('host') || `localhost:${PORT}`;
  return `${req.protocol}://${host}`;
}

// Compresie HTTP pentru răspunsuri rapide pe mobil / Wi-Fi
app.use(compression());

// Middleware parsare JSON și formulare
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder static pentru fișiere publice cu politică de cache
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir, { maxAge: '1h' }));

// Servire fișiere bonuri PDF generate
const receiptsDir = path.join(__dirname, '../data/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}
app.use('/receipts', express.static(receiptsDir, { maxAge: '1d' }));

// ==========================================
// 1. RUTE SSE (SERVER-SENT EVENTS - D-002)
// ==========================================
app.get('/api/events', (req, res) => {
  sseHub.handleConnection(req, res);
});

// ==========================================
// 2. RUTE MESE (1 - 12)
// ==========================================
app.get('/api/tables', (req, res) => {
  try {
    const tables = db.getTables();
    res.json({ success: true, tables });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tables/:table_number/status', (req, res) => {
  try {
    const tableNumber = Number(req.params.table_number);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 12) {
      return res.status(400).json({ success: false, error: 'Număr masă invalid: trebuie să fie între 1 și 12.' });
    }
    const { status } = req.body;
    const updated = db.updateTableStatus(tableNumber, status);

    // Notificare în timp real către toate ecranele
    sseHub.broadcast('table:status', { table_number: tableNumber, status });

    res.json({ success: true, table: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. RUTE MENIU & EXTRA-URI
// ==========================================
app.get('/api/menu', (req, res) => {
  try {
    const menu = db.getMenuWithAvailability();
    const extras = db.getDishExtras();
    res.json({ success: true, menu, extras });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/extras', (req, res) => {
  try {
    const extras = db.getDishExtras();
    res.json({ success: true, extras });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Listă oficială alergeni (Directiva CE 2000-13 / H.G. 751/2008)
app.get('/api/allergens', (req, res) => {
  try {
    const allergens = AllergenService.getAllergensList();
    res.json({ success: true, allergens });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. RUTE COMENZI (D-004, PATTERN-002)
// ==========================================
app.get('/api/orders', (req, res) => {
  try {
    const { status, table_number, activeOnly } = req.query;
    const orders = db.getOrders({
      status,
      table_number: table_number ? Number(table_number) : undefined,
      activeOnly: activeOnly === 'true' || activeOnly === '1'
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Comanda nu a fost găsită' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/table/:table_number', (req, res) => {
  try {
    const tableNumber = Number(req.params.table_number);
    const orders = db.getTableActiveOrders(tableNumber);
    const totalAmount = orders.reduce((sum, ord) => sum + ord.total_price, 0);
    res.json({ success: true, table_number: tableNumber, orders, total_amount: totalAmount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { table_number, items, client_supplied_price } = req.body;

    // Plasare atomică în SQLite (D-004: prețul din client este ignorat autoritar)
    const order = db.placeOrderAtomic({
      table_number: Number(table_number),
      items,
      client_supplied_price
    });

    // Emisie SSE instant către KDS și mese
    sseHub.broadcast('order:new', order);
    sseHub.broadcast('table:status', { table_number: Number(table_number), status: 'ocupată' });

    res.status(201).json({ success: true, order });
  } catch (err) {
    // 409 Conflict dacă stocul este insuficient sau eroare de validare
    const statusCode = err.message.includes('Stoc insuficient') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

app.post('/api/orders/:id/status', (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    if (status === 'achitată') {
      return res.status(400).json({ success: false, error: "Starea 'achitată' poate fi stabilită doar prin încasarea la casă (/api/payments)." });
    }
    const updated = db.updateOrderStatus(orderId, status);

    // Emisie SSE stare actualizată
    sseHub.broadcast('order:status', { order_id: orderId, status, updated });

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. RUTE ÎNCASARE & BON FISCAL PDF (D-005, D-006)
// ==========================================
app.post('/api/payments', async (req, res) => {
  try {
    const { table_number, payment_method } = req.body;
    const tableNum = Number(table_number);
    if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 12) {
      return res.status(400).json({ success: false, error: 'Număr masă invalid: trebuie să fie între 1 și 12.' });
    }

    // 1. Obținere comenzi active pentru masă înainte de închidere
    const activeOrders = db.getTableActiveOrders(tableNum);
    if (!activeOrders || activeOrders.length === 0) {
      return res.status(400).json({ success: false, error: `Masa ${tableNum} nu are comenzi active de încasat.` });
    }

    // 2. Procesare plată în SQLite (tranzacție atomică D-006)
    const payment = db.processPayment({
      table_number: tableNum,
      payment_method
    });

    // 3. Generare server-side a bonului fiscal în format PDF
    const { filePath, fileName } = await PDFService.generateReceiptPDF(payment, activeOrders);

    // Actualizare cale PDF în tabela payments
    db.db.prepare('UPDATE payments SET pdf_receipt_path = ? WHERE id = ?').run(fileName, payment.payment_id);
    payment.pdf_receipt_path = fileName;

    // 4. Emisie eveniment SSE eliberare masă și plată confirmată
    sseHub.broadcast('payment:done', {
      payment_id: payment.payment_id,
      table_number: tableNum,
      total_amount: payment.total_amount,
      pdf_url: `/receipts/${fileName}`
    });
    sseHub.broadcast('table:status', { table_number: tableNum, status: 'liberă' });

    res.status(201).json({
      success: true,
      payment,
      pdf_url: `/receipts/${fileName}`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Obținere istoric plăți / bonuri fiscale emise pentru ecranul de casă
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.getPayments(30);
    const formatted = payments.map(p => ({
      ...p,
      pdf_url: p.pdf_receipt_path ? `/receipts/${p.pdf_receipt_path}` : null
    }));
    res.json({ success: true, payments: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Descărcare directă bon fiscal PDF cu protecție sanitară strictă (anti-Path Traversal)
app.get('/api/receipts/:fileName', (req, res) => {
  const cleanName = path.basename(req.params.fileName);
  if (!/^bon_[a-zA-Z0-9_-]+\.pdf$/.test(cleanName)) {
    return res.status(400).send('Nume fișier invalid.');
  }
  const filePath = path.join(receiptsDir, cleanName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Bonul fiscal PDF nu a fost găsit.');
  }
  res.sendFile(filePath);
});

// ==========================================
// 6. RUTE CODURI QR (D-005)
// ==========================================
app.get('/api/qr/:table_number', async (req, res) => {
  try {
    const tableNumber = Number(req.params.table_number);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 12) {
      return res.status(400).json({ success: false, error: 'Număr masă invalid: 1-12' });
    }
    const hostUrl = getBaseUrl(req);
    const qrDataUrl = await QRService.generateTableQRDataURL(tableNumber, hostUrl);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, table_number: tableNumber, qr_data_url: qrDataUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/qr/:table_number/image.png', async (req, res) => {
  try {
    const tableNumber = Number(req.params.table_number);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 12) {
      return res.status(400).send('Număr masă invalid: 1-12');
    }
    const hostUrl = getBaseUrl(req);
    const buffer = await QRService.generateTableQRBuffer(tableNumber, hostUrl);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Eroare generare QR');
  }
});

app.get('/api/qr-all', async (req, res) => {
  try {
    const hostUrl = getBaseUrl(req);
    const qrList = await QRService.generateAllTablesQR(hostUrl);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, qr_codes: qrList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. RUTE ADMIN & INVENTAR STOCURI
// ==========================================
app.get('/api/admin/inventory', (req, res) => {
  try {
    const inventory = db.getInventory();
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/restock', (req, res) => {
  try {
    const { ingredient_id, quantity } = req.body;
    const updated = db.restockIngredient(ingredient_id, quantity);

    // Emisie SSE actualizare stoc
    sseHub.broadcast('stock:update', { ingredient: updated });

    res.json({ success: true, ingredient: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/reset', (req, res) => {
  try {
    seedDatabase(DB_PATH);
    sseHub.broadcast('system:reset', { time: Date.now() });
    res.json({ success: true, message: 'Baza de date a fost resetată cu datele inițiale Kon Tiki.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. RUTE STATICE CONVENABILE (PATTERN-001)
// ==========================================
app.get('/menu', (req, res) => res.sendFile(path.join(publicDir, 'client-menu.html')));
app.get('/order-status', (req, res) => res.sendFile(path.join(publicDir, 'order-status.html')));
app.get('/waiter', (req, res) => res.sendFile(path.join(publicDir, 'waiter.html')));
app.get('/kds', (req, res) => res.sendFile(path.join(publicDir, 'kds.html')));
app.get('/cashier', (req, res) => res.sendFile(path.join(publicDir, 'cashier.html')));
app.get('/monitor', (req, res) => res.sendFile(path.join(publicDir, 'monitor.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/qr-tables', (req, res) => res.sendFile(path.join(publicDir, 'qr-tables.html')));

// Pornire server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Restaurant Kon Tiki Server pornit pe portul ${PORT}`);
    console.log(`URL local: http://localhost:${PORT}`);
    console.log(`Ecrane disponibile conform PATTERN-001:`);
    console.log(`- Meniu Digital:        http://localhost:${PORT}/client-menu.html?masa=1`);
    console.log(`- Stadiu Comandă Masă:  http://localhost:${PORT}/order-status.html?masa=1`);
    console.log(`- Comenzi Ospătar:      http://localhost:${PORT}/waiter.html`);
    console.log(`- Kitchen Display (KDS):http://localhost:${PORT}/kds.html`);
    console.log(`- Ecran Casă / Încasare:http://localhost:${PORT}/cashier.html`);
    console.log(`- Monitor Restaurant:   http://localhost:${PORT}/monitor.html`);
    console.log(`- Administrare Stocuri: http://localhost:${PORT}/admin.html`);
    console.log(`- Standuri QR Mese:     http://localhost:${PORT}/qr-tables.html`);
    console.log(`====================================================`);
  });
}

module.exports = app;
