/**
 * src/db/database.js
 * Modulul de persistență SQLite pentru Restaurant Kon Tiki.
 * Implementat folosind modulul nativ node:sqlite (DatabaseSync) cu suport tranzacțional ACID.
 * 
 * Conformează cu: D-001, D-004, D-006, CONTEXT.md
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const AvailabilityService = require('../services/availabilityService');

class RestaurantDB {
  constructor(dbPath) {
    const finalPath = dbPath || path.join(__dirname, '../../data/restaurant.db');
    const dataDir = path.dirname(finalPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new DatabaseSync(finalPath);
    this.init();
  }

  init() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      -- 1. Mesele 1-12
      CREATE TABLE IF NOT EXISTS tables (
        table_number INTEGER PRIMARY KEY CHECK(table_number BETWEEN 1 AND 12),
        status TEXT NOT NULL DEFAULT 'liberă' CHECK(status IN ('liberă', 'ocupată', 'rezervată')),
        qr_code_url TEXT NOT NULL
      );

      -- 2. Ingrediente & Stocuri
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL CHECK(unit IN ('cupă', 'bucată', 'porție', 'coșuleț')),
        current_stock INTEGER NOT NULL CHECK(current_stock >= 0),
        min_threshold INTEGER NOT NULL DEFAULT 5
      );

      -- 3. Preparate
      CREATE TABLE IF NOT EXISTS dishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        weight TEXT NOT NULL DEFAULT '',
        allergens TEXT NOT NULL -- JSON array
      );

      -- 4. Rețete (compoziție per preparat)
      CREATE TABLE IF NOT EXISTS recipe_items (
        dish_id TEXT REFERENCES dishes(id) ON DELETE CASCADE,
        ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        PRIMARY KEY(dish_id, ingredient_id)
      );

      -- 5. Extra-uri
      CREATE TABLE IF NOT EXISTS dish_extras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ingredient_id TEXT REFERENCES ingredients(id),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        price REAL NOT NULL DEFAULT 0.0
      );

      -- 6. Sloturi Alocate / Programări (Anti Double-Booking)
      CREATE TABLE IF NOT EXISTS resource_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_type TEXT NOT NULL CHECK(resource_type IN ('staff', 'table', 'oven')),
        resource_id TEXT NOT NULL,
        start_minute INTEGER NOT NULL,
        end_minute INTEGER NOT NULL,
        order_id TEXT,
        phase_index INTEGER,
        CHECK(start_minute < end_minute)
      );

      -- 7. Comenzi
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_number INTEGER REFERENCES tables(table_number),
        status TEXT NOT NULL DEFAULT 'plasată' CHECK(status IN ('plasată', 'în preparare', 'gata', 'servită', 'achitată')),
        total_price REAL NOT NULL,
        placed_at INTEGER NOT NULL,
        ready_at INTEGER,
        paid_at INTEGER
      );

      -- 8. Articole comandate
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        dish_id TEXT REFERENCES dishes(id),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        selected_extras TEXT, -- JSON array
        item_price REAL NOT NULL
      );

      -- 9. Plăți și Încasări
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        table_number INTEGER REFERENCES tables(table_number),
        order_ids TEXT NOT NULL, -- JSON array
        payment_method TEXT NOT NULL CHECK(payment_method IN ('Card', 'Numerar')),
        total_amount REAL NOT NULL,
        pdf_receipt_path TEXT,
        paid_at INTEGER NOT NULL
      );
    `);

    try {
      this.db.exec("ALTER TABLE dishes ADD COLUMN weight TEXT NOT NULL DEFAULT ''");
    } catch {
      // Coloana weight există deja
    }
  }

  /**
   * Returnează harta stocurilor: { [ingredient_id]: current_stock }
   */
  getStockMap() {
    const rows = this.db.prepare('SELECT id, current_stock FROM ingredients').all();
    const map = {};
    for (const r of rows) {
      map[r.id] = r.current_stock;
    }
    return map;
  }

  /**
   * Returnează meniul complet cu disponibilitatea calculată dinamic în timp real.
   */
  getMenuWithAvailability() {
    const dishes = this.db.prepare('SELECT id, name, category, price, weight, allergens FROM dishes').all();
    const recipeRows = this.db.prepare('SELECT dish_id, ingredient_id, quantity, unit FROM recipe_items').all();
    const stockMap = this.getStockMap();

    // Grupare rețete pe preparate
    const recipesByDish = {};
    for (const r of recipeRows) {
      if (!recipesByDish[r.dish_id]) recipesByDish[r.dish_id] = [];
      recipesByDish[r.dish_id].push({
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
        unit: r.unit
      });
    }

    return dishes.map(d => {
      const recipe = recipesByDish[d.id] || [];
      const allergens = JSON.parse(d.allergens || '[]');
      const avail = AvailabilityService.calculateDishAvailability({ recipe }, stockMap);
      return {
        id: d.id,
        name: d.name,
        category: d.category,
        price: d.price,
        weight: d.weight || '',
        allergens,
        recipe,
        is_available: avail.is_available,
        max_portions: avail.max_portions
      };
    });
  }

  /**
   * Plasare atomică a comenzii cu scădere de stoc și calcul autoritar pe server (D-004, D-006).
   * Dacă oricare ingredient este insuficient, tranzacția face ROLLBACK complet.
   * 
   * @param {object} payload
   * @param {number} payload.table_number - Masa 1-12
   * @param {Array<{ dish_id: string, quantity: number, extras?: Array<string> }>} payload.items
   * @param {number} [payload.client_supplied_price] - Ignorat autoritar pe server (anti-fraudă)
   * @returns {object} Comanda confirmată
   */
  placeOrderAtomic({ table_number, items, client_supplied_price }) {
    if (!table_number || table_number < 1 || table_number > 12) {
      throw new Error(`Număr masă invalid: ${table_number}. Localul are exact 12 mese.`);
    }
    if (!items || items.length === 0) {
      throw new Error('Comanda trebuie să conțină cel puțin un preparat.');
    }

    // Începem tranzacția exclusivă (lock de scriere imediat)
    this.db.exec('BEGIN IMMEDIATE');

    try {
      // 1. Calcul stoc necesar agregat pentru întreaga comandă
      const requiredStock = {}; // { ingredient_id: total_quantity }
      let serverCalculatedTotal = 0;

      const getDish = this.db.prepare('SELECT id, name, price FROM dishes WHERE id = ?');
      const getRecipe = this.db.prepare('SELECT ingredient_id, quantity FROM recipe_items WHERE dish_id = ?');
      const getExtra = this.db.prepare('SELECT id, name, ingredient_id, quantity, price FROM dish_extras WHERE id = ?');

      const processedItems = [];

      for (const item of items) {
        const dish = getDish.get(item.dish_id);
        if (!dish) {
          throw new Error(`Preparatul cu ID-ul ${item.dish_id} nu există.`);
        }

        const qty = item.quantity || 1;
        let itemTotal = dish.price * qty;

        // Adăugare ingrediente rețetă de bază
        const recipe = getRecipe.all(item.dish_id);
        for (const r of recipe) {
          requiredStock[r.ingredient_id] = (requiredStock[r.ingredient_id] || 0) + (r.quantity * qty);
        }

        // Adăugare ingrediente și cost extra-uri
        const itemExtras = [];
        if (item.extras && Array.isArray(item.extras)) {
          for (const extraId of item.extras) {
            const extra = getExtra.get(extraId);
            if (!extra) {
              throw new Error(`Opțiunea extra ${extraId} nu există.`);
            }
            itemExtras.push({ id: extra.id, name: extra.name, price: extra.price });
            itemTotal += extra.price * qty;
            requiredStock[extra.ingredient_id] = (requiredStock[extra.ingredient_id] || 0) + (extra.quantity * qty);
          }
        }

        serverCalculatedTotal += itemTotal;
        processedItems.push({
          dish_id: dish.id,
          name: dish.name,
          quantity: qty,
          extras: itemExtras,
          item_price: itemTotal
        });
      }

      // 2. Verificare atomică a disponibilității stocului pentru fiecare ingredient
      const getStock = this.db.prepare('SELECT id, name, current_stock, unit FROM ingredients WHERE id = ?');
      for (const [ingId, reqQty] of Object.entries(requiredStock)) {
        const ing = getStock.get(ingId);
        if (!ing || ing.current_stock < reqQty) {
          const ingName = ing ? ing.name : ingId;
          const available = ing ? ing.current_stock : 0;
          const unit = ing ? ing.unit : '';
          throw new Error(`Stoc insuficient pentru ingredientul "${ingName}". Necesar: ${reqQty} ${unit}, Disponibil: ${available} ${unit}. Comanda a fost respinsă fără a modifica stocul.`);
        }
      }

      // 3. Decrementare stocuri ingrediente
      const updateStock = this.db.prepare('UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ?');
      for (const [ingId, reqQty] of Object.entries(requiredStock)) {
        updateStock.run(reqQty, ingId);
      }

      // 4. Inserare comandă cu total calculat strict de server (D-004)
      const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = Date.now();

      this.db.prepare(`
        INSERT INTO orders (id, table_number, status, total_price, placed_at)
        VALUES (?, ?, 'plasată', ?, ?)
      `).run(orderId, table_number, serverCalculatedTotal, now);

      // Inserare articole comandă
      const insertItem = this.db.prepare(`
        INSERT INTO order_items (id, order_id, dish_id, quantity, selected_extras, item_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < processedItems.length; i++) {
        const it = processedItems[i];
        insertItem.run(
          `${orderId}-item-${i + 1}`,
          orderId,
          it.dish_id,
          it.quantity,
          JSON.stringify(it.extras),
          it.item_price
        );
      }

      // 5. Actualizare stare masă -> ocupată dacă era liberă
      this.db.prepare(`
        UPDATE tables 
        SET status = 'ocupată' 
        WHERE table_number = ? AND status = 'liberă'
      `).run(table_number);

      this.db.exec('COMMIT');

      return {
        order_id: orderId,
        table_number,
        status: 'plasată',
        total_price: serverCalculatedTotal,
        placed_at: now,
        items: processedItems
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Alocare atomică de slot pentru un serviciu fracționat (Split Service).
   * Garanție strictă: niciun slot nu poate fi programat de două ori pe aceeași resursă.
   * 
   * @param {object} params
   * @param {string} params.resource_type - 'staff' | 'table' | 'oven'
   * @param {string} params.resource_id - identificator resursă (ex. 'cook-1', 'table-4')
   * @param {number} params.candidate_start_minute - minutul propus de începere
   * @param {string} params.order_id - identificator comandă
   * @param {object} [params.options] - opțiuni durată / toleranță
   * @returns {object} Sloturile alocate
   */
  bookSplitServiceAtomic({ resource_type, resource_id, candidate_start_minute, order_id, options = {} }) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      // 1. Obținere intervale ocupate existente pentru această resursă
      const busyRows = this.db.prepare(`
        SELECT start_minute, end_minute 
        FROM resource_slots 
        WHERE resource_type = ? AND resource_id = ?
      `).all(resource_type, resource_id);

      const busyIntervals = busyRows.map(r => ({ start: r.start_minute, end: r.end_minute }));
      const shiftEnd = options.shiftEnd || 1440; // 24h orizont
      const freeIntervals = AvailabilityService.computeFreeIntervals(0, shiftEnd, busyIntervals);

      // 2. Evaluare cu algoritmul split service (cu toleranță)
      const evalResult = AvailabilityService.canBookSplitService(candidate_start_minute, freeIntervals, shiftEnd, options);
      if (!evalResult.available) {
        throw new Error(`Conflict de programare: Resursa ${resource_type} [${resource_id}] nu este liberă pentru etapele serviciului fracționat la minutul ${candidate_start_minute}.`);
      }

      // 3. Inserare faze active (Faza 1 și Faza 3)
      const insertSlot = this.db.prepare(`
        INSERT INTO resource_slots (resource_type, resource_id, start_minute, end_minute, order_id, phase_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertSlot.run(resource_type, resource_id, evalResult.p1.start, evalResult.p1.end, order_id, 1);
      insertSlot.run(resource_type, resource_id, evalResult.p3.start, evalResult.p3.end, order_id, 3);

      this.db.exec('COMMIT');

      return {
        booked: true,
        resource_type,
        resource_id,
        order_id,
        p1: evalResult.p1,
        p3: evalResult.p3,
        wait_minutes: evalResult.waitMinutes
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Returnează lista tuturor meselor (1-12) cu statusul curent și comenzi active.
   */
  getTables() {
    const tables = this.db.prepare('SELECT table_number, status, qr_code_url FROM tables ORDER BY table_number ASC').all();
    const activeOrders = this.db.prepare(`
      SELECT id, table_number, status, total_price, placed_at 
      FROM orders 
      WHERE status != 'achitată'
      ORDER BY placed_at DESC
    `).all();

    const ordersByTable = {};
    for (const ord of activeOrders) {
      if (!ordersByTable[ord.table_number]) ordersByTable[ord.table_number] = [];
      ordersByTable[ord.table_number].push(ord);
    }

    return tables.map(t => ({
      ...t,
      active_orders: ordersByTable[t.table_number] || []
    }));
  }

  /**
   * Actualizează starea unei mese (liberă, ocupată, rezervată).
   */
  updateTableStatus(table_number, status) {
    if (!['liberă', 'ocupată', 'rezervată'].includes(status)) {
      throw new Error(`Stare masă invalidă: ${status}. Permise: liberă, ocupată, rezervată`);
    }
    const res = this.db.prepare('UPDATE tables SET status = ? WHERE table_number = ?').run(status, table_number);
    if (res.changes === 0) {
      throw new Error(`Masa ${table_number} nu a fost găsită.`);
    }
    return { table_number, status };
  }

  /**
   * Obține comenzile, opțional filtrate după status sau număr masă.
   */
  getOrders({ status, table_number, activeOnly } = {}) {
    let sql = 'SELECT id, table_number, status, total_price, placed_at, ready_at, paid_at FROM orders WHERE 1=1';
    const params = [];

    if (activeOnly) {
      sql += " AND status != 'achitată'";
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (table_number) {
      sql += ' AND table_number = ?';
      params.push(Number(table_number));
    }

    sql += ' ORDER BY placed_at ASC';
    const orders = this.db.prepare(sql).all(...params);

    const getItems = this.db.prepare(`
      SELECT oi.id, oi.dish_id, oi.quantity, oi.selected_extras, oi.item_price, d.name AS dish_name
      FROM order_items oi
      JOIN dishes d ON d.id = oi.dish_id
      WHERE oi.order_id = ?
    `);

    return orders.map(ord => {
      const items = getItems.all(ord.id).map(it => ({
        ...it,
        extras: JSON.parse(it.selected_extras || '[]')
      }));
      return {
        ...ord,
        items
      };
    });
  }

  /**
   * Obține o comandă după ID.
   */
  getOrderById(orderId) {
    const ord = this.db.prepare('SELECT id, table_number, status, total_price, placed_at, ready_at, paid_at FROM orders WHERE id = ?').get(orderId);
    if (!ord) return null;

    const items = this.db.prepare(`
      SELECT oi.id, oi.dish_id, oi.quantity, oi.selected_extras, oi.item_price, d.name AS dish_name
      FROM order_items oi
      JOIN dishes d ON d.id = oi.dish_id
      WHERE oi.order_id = ?
    `).all(orderId).map(it => ({
      ...it,
      extras: JSON.parse(it.selected_extras || '[]')
    }));

    return { ...ord, items };
  }

  /**
   * Actualizează starea unei comenzi (plasată -> în preparare -> gata -> servită -> achitată).
   */
  updateOrderStatus(orderId, newStatus) {
    const valid = ['plasată', 'în preparare', 'gata', 'servită', 'achitată'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Stare comandă invalidă: ${newStatus}. Valori permise: ${valid.join(', ')}`);
    }

    const now = Date.now();
    let sql = 'UPDATE orders SET status = ?';
    const params = [newStatus];

    if (newStatus === 'gata') {
      sql += ', ready_at = ?';
      params.push(now);
    } else if (newStatus === 'achitată') {
      sql += ', paid_at = ?';
      params.push(now);
    }

    sql += ' WHERE id = ?';
    params.push(orderId);

    const res = this.db.prepare(sql).run(...params);
    if (res.changes === 0) {
      throw new Error(`Comanda cu ID-ul ${orderId} nu a fost găsită.`);
    }

    return this.getOrderById(orderId);
  }

  /**
   * Obține comenzile active neachitate pentru o masă (consum cumulativ D-006).
   */
  getTableActiveOrders(tableNumber) {
    return this.getOrders({ table_number: tableNumber, activeOnly: true });
  }

  /**
   * Înregistrează plata cumulată a consumației pe masă (D-006).
   * Schimbă starea comenzilor în 'achitată', eliberează masa ('liberă') și returnează datele de încasare.
   */
  processPayment({ table_number, payment_method, pdf_receipt_path }) {
    if (!['Card', 'Numerar'].includes(payment_method)) {
      throw new Error(`Metodă de plată invalidă: ${payment_method}. Permise: Card, Numerar`);
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const activeOrders = this.db.prepare(`
        SELECT id, total_price 
        FROM orders 
        WHERE table_number = ? AND status != 'achitată'
      `).all(table_number);

      if (activeOrders.length === 0) {
        throw new Error(`Masa ${table_number} nu are nicio consumație activă de încasat.`);
      }

      let totalAmount = 0;
      const orderIds = [];
      for (const ord of activeOrders) {
        totalAmount += ord.total_price;
        orderIds.push(ord.id);
      }

      const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = Date.now();

      // Inserare plată
      this.db.prepare(`
        INSERT INTO payments (id, table_number, order_ids, payment_method, total_amount, pdf_receipt_path, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        table_number,
        JSON.stringify(orderIds),
        payment_method,
        totalAmount,
        pdf_receipt_path || null,
        now
      );

      // Actualizare comenzi ca achitate
      const markPaid = this.db.prepare(`
        UPDATE orders 
        SET status = 'achitată', paid_at = ? 
        WHERE id = ?
      `);
      for (const id of orderIds) {
        markPaid.run(now, id);
      }

      // Eliberare masă
      this.db.prepare(`
        UPDATE tables 
        SET status = 'liberă' 
        WHERE table_number = ?
      `).run(table_number);

      this.db.exec('COMMIT');

      return {
        payment_id: paymentId,
        table_number,
        order_ids: orderIds,
        payment_method,
        total_amount: totalAmount,
        pdf_receipt_path,
        paid_at: now
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Returnează inventarul de ingrediente pentru ecranul de Admin.
   */
  getInventory() {
    return this.db.prepare(`
      SELECT id, name, unit, current_stock, min_threshold 
      FROM ingredients 
      ORDER BY name ASC
    `).all();
  }

  /**
   * Actualizează / aprovizionează stocul unui ingredient (Admin).
   */
  restockIngredient(ingredientId, addQuantity) {
    const qty = Number(addQuantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Cantitate invalidă de aprovizionare: ${addQuantity}`);
    }

    const res = this.db.prepare(`
      UPDATE ingredients 
      SET current_stock = current_stock + ? 
      WHERE id = ?
    `).run(qty, ingredientId);

    if (res.changes === 0) {
      throw new Error(`Ingredientul ${ingredientId} nu există.`);
    }

    return this.db.prepare('SELECT id, name, unit, current_stock, min_threshold FROM ingredients WHERE id = ?').get(ingredientId);
  }

  /**
   * Returnează lista tuturor opțiunilor extra disponibile.
   */
  getDishExtras() {
    return this.db.prepare(`
      SELECT de.id, de.name, de.ingredient_id, de.quantity, de.price, i.current_stock, i.unit
      FROM dish_extras de
      JOIN ingredients i ON i.id = de.ingredient_id
      ORDER BY de.name ASC
    `).all();
  }

  /**
   * Închide conexiunea cu baza de date.
   */
  close() {
    this.db.close();
  }
}

module.exports = RestaurantDB;
