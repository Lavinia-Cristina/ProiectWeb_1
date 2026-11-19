/**
 * src/services/pdfService.js
 * Serviciu server-side pentru generarea bonului fiscal în format PDF (D-005, D-006).
 * Utilizează pachetul 'pdfkit' pentru emiterea bonului unic consolidat la încasare.
 */

const PDFDocument = require('pdfkit');
const fs = require('node:fs');
const path = require('node:path');

class PDFService {
  /**
   * Generează fișierul PDF pentru bonul fiscal consolidat al unei mese.
   * 
   * @param {object} payment
   * @param {string} payment.payment_id
   * @param {number} payment.table_number
   * @param {string} payment.payment_method - 'Card' | 'Numerar'
   * @param {number} payment.total_amount
   * @param {number} payment.paid_at
   * @param {Array<object>} orders - comenzile consolidate pentru masă
   * @param {string} [customReceiptsDir]
   * @returns {Promise<{ filePath: string, fileName: string }>}
   */
  static generateReceiptPDF(payment, orders = [], customReceiptsDir) {
    return new Promise((resolve, reject) => {
      try {
        const receiptsDir = customReceiptsDir || path.join(__dirname, '../../data/receipts');
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }

        const fileName = `bon_${payment.payment_id}.pdf`;
        const filePath = path.join(receiptsDir, fileName);

        // Document dimensionat stil bon de casă (lățime 80mm ~ 226pt, înălțime dinamică sau 600pt)
        const doc = new PDFDocument({
          size: [240, 650],
          margin: 15
        });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Antet Bon Fiscal
        doc.font('Helvetica-Bold').fontSize(14).text('RESTAURANT KON TIKI', { align: 'center' });
        doc.font('Helvetica').fontSize(8).text('SC KON TIKI BISTRÔ SRL', { align: 'center' });
        doc.text('CUI: RO48920114 · J40/1234/2026', { align: 'center' });
        doc.text('Str. Restaurantului nr. 12, Sector 1', { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(10).text('*** BON FISCAL ***', { align: 'center' });
        doc.moveDown(0.5);

        // Date identificare
        const dateStr = new Date(payment.paid_at || Date.now()).toLocaleString('ro-RO');
        doc.font('Helvetica').fontSize(8);
        doc.text(`ID Încasare: ${payment.payment_id}`);
        doc.text(`Data / Ora: ${dateStr}`);
        doc.text(`Masă: Masa ${payment.table_number} (12 Mese Local)`);
        doc.text(`Metodă Plată: ${payment.payment_method === 'Card' ? 'Card (POS Fizic)' : 'Numerar'}`);
        doc.moveDown(0.5);

        // Linie despărțitoare
        doc.text('----------------------------------------------------');
        doc.font('Helvetica-Bold').fontSize(8).text('ARTICOLE CONSUMATE');
        doc.font('Helvetica').fontSize(8).text('----------------------------------------------------');

        // Articole cumulate din comenzi
        let totalItemsCount = 0;
        for (const ord of orders) {
          if (!ord.items) continue;
          for (const it of ord.items) {
            totalItemsCount += it.quantity;
            const lineTotal = Number(it.item_price).toFixed(2);
            doc.font('Helvetica-Bold').fontSize(8);
            doc.text(`${it.quantity}x ${it.dish_name || it.dish_id}`);
            doc.font('Helvetica').fontSize(8);

            // Extras afișate sub preparat
            if (it.extras && it.extras.length > 0) {
              const extrasText = it.extras.map(e => `+ ${e.name}`).join(', ');
              doc.fontSize(7).fillColor('#555555').text(`   ${extrasText}`);
              doc.fontSize(8).fillColor('#000000');
            }

            doc.text(`   Preț calculat server: ${lineTotal} LEI`);
            doc.moveDown(0.2);
          }
        }

        if (totalItemsCount === 0) {
          doc.text(`Consumație masă: ${payment.total_amount.toFixed(2)} LEI`);
        }

        // Linie despărțitoare
        doc.text('----------------------------------------------------');
        doc.moveDown(0.3);

        // Total autoritar server (D-004, D-006)
        const totalVal = Number(payment.total_amount).toFixed(2);
        const tvaVal = (payment.total_amount * 0.09 / 1.09).toFixed(2); // TVA alimente 9%

        doc.font('Helvetica-Bold').fontSize(11).text(`TOTAL: ${totalVal} LEI`, { align: 'right' });
        doc.font('Helvetica').fontSize(7).text(`(din care TVA 9%: ${tvaVal} LEI)`, { align: 'right' });
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(8);
        doc.text(`ACHITAT PRIN: ${payment.payment_method === 'Card' ? 'CARD (POS FIZIC)' : 'NUMERAR'}`);
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(7);
        doc.text('Comenzile mesei au fost consolidate cumulativ (D-006).');
        doc.text('Calculul valoric este autoritar pe server (D-004).');
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(9).text('VĂ MULȚUMIM PENTRU VIZITĂ!', { align: 'center' });
        doc.font('Helvetica').fontSize(8).text('Vă așteptăm din nou la Restaurant Kon Tiki!', { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PDFService;
