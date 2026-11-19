/**
 * src/services/pdfService.js
 * Serviciu server-side pentru generarea bonului fiscal în format PDF (D-005, D-006).
 * Utilizează pachetul 'pdfkit' pentru emiterea bonului unic consolidat la încasare.
 */

const PDFDocument = require('pdfkit');
const fs = require('node:fs');
const path = require('node:path');

// Identificare fonturi TrueType cu suport complet Unicode (diacritice românești: ă, î, â, ș, ț)
const WIN_ARIAL = 'C:/Windows/Fonts/arial.ttf';
const WIN_ARIAL_BOLD = 'C:/Windows/Fonts/arialbd.ttf';
const hasUnicodeFont = fs.existsSync(WIN_ARIAL) && fs.existsSync(WIN_ARIAL_BOLD);

// Fallback normalizare diacritice în cazul în care fontul Unicode nu este disponibil
function sanitizeText(str) {
  if (!str) return '';
  if (hasUnicodeFont) return String(str);
  return String(str)
    .replace(/ă/g, 'a').replace(/Ă/g, 'A')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/ș/g, 's').replace(/Ș/g, 'S')
    .replace(/ț/g, 't').replace(/Ț/g, 'T');
}

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

        // Document dimensionat stil bon de casă (lățime 80mm ~ 226pt, înălțime dinamică sau 650pt)
        const doc = new PDFDocument({
          size: [240, 650],
          margin: 15
        });

        const fontRegular = hasUnicodeFont ? WIN_ARIAL : 'Helvetica';
        const fontBold = hasUnicodeFont ? WIN_ARIAL_BOLD : 'Helvetica-Bold';

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Antet Bon Fiscal
        doc.font(fontBold).fontSize(14).text('RESTAURANT KON TIKI', { align: 'center' });
        doc.font(fontRegular).fontSize(8).text(sanitizeText('SC KON TIKI BISTRÔ SRL'), { align: 'center' });
        doc.text('CUI: RO48920114 · J40/1234/2026', { align: 'center' });
        doc.text(sanitizeText('Str. Restaurantului nr. 12, Sector 1'), { align: 'center' });
        doc.moveDown(0.5);

        doc.font(fontBold).fontSize(10).text('*** BON FISCAL ***', { align: 'center' });
        doc.moveDown(0.5);

        // Date identificare
        const dateStr = new Date(payment.paid_at || Date.now()).toLocaleString('ro-RO');
        doc.font(fontRegular).fontSize(8);
        doc.text(sanitizeText(`ID Încasare: ${payment.payment_id}`));
        doc.text(sanitizeText(`Data / Ora: ${dateStr}`));
        doc.text(sanitizeText(`Masă: Masa ${payment.table_number} (12 Mese Local)`));
        doc.text(sanitizeText(`Metodă Plată: ${payment.payment_method === 'Card' ? 'Card (POS Fizic)' : 'Numerar'}`));
        doc.moveDown(0.5);

        // Linie despărțitoare
        doc.text('----------------------------------------------------');
        doc.font(fontBold).fontSize(8).text(sanitizeText('ARTICOLE CONSUMATE'));
        doc.font(fontRegular).fontSize(8).text('----------------------------------------------------');

        // Articole cumulate din comenzi
        let totalItemsCount = 0;
        for (const ord of orders) {
          if (!ord.items) continue;
          for (const it of ord.items) {
            totalItemsCount += it.quantity;
            const lineTotal = Number(it.item_price).toFixed(2);
            doc.font(fontBold).fontSize(8);
            doc.text(sanitizeText(`${it.quantity}x ${it.dish_name || it.dish_id}`));
            doc.font(fontRegular).fontSize(8);

            // Extras afișate sub preparat
            if (it.extras && it.extras.length > 0) {
              const extrasText = it.extras.map(e => `+ ${sanitizeText(e.name)}`).join(', ');
              doc.fontSize(7).fillColor('#555555').text(`   ${extrasText}`);
              doc.fontSize(8).fillColor('#000000');
            }

            doc.text(sanitizeText(`   Preț calculat: ${lineTotal} LEI`));
            doc.moveDown(0.2);
          }
        }

        if (totalItemsCount === 0) {
          doc.text(sanitizeText(`Consumație masă: ${payment.total_amount.toFixed(2)} LEI`));
        }

        // Linie despărțitoare
        doc.text('----------------------------------------------------');
        doc.moveDown(0.3);

        // Total autoritar server
        const totalVal = Number(payment.total_amount).toFixed(2);
        const tvaVal = (payment.total_amount * 0.09 / 1.09).toFixed(2); // TVA alimente 9%

        doc.font(fontBold).fontSize(11).text(`TOTAL: ${totalVal} LEI`, { align: 'right' });
        doc.font(fontRegular).fontSize(7).text(`(din care TVA 9%: ${tvaVal} LEI)`, { align: 'right' });
        doc.moveDown(0.5);

        doc.font(fontBold).fontSize(8);
        doc.text(sanitizeText(`ACHITAT PRIN: ${payment.payment_method === 'Card' ? 'CARD (POS FIZIC)' : 'NUMERAR'}`));
        doc.moveDown(0.5);

        doc.font(fontRegular).fontSize(7);
        doc.text(sanitizeText('Comenzile mesei au fost consolidate cumulativ.'));
        doc.text(sanitizeText('Calculul valoric este autoritar pe server.'));
        doc.moveDown(0.5);

        doc.font(fontBold).fontSize(9).text(sanitizeText('VĂ MULȚUMIM PENTRU VIZITĂ!'), { align: 'center' });
        doc.font(fontRegular).fontSize(8).text(sanitizeText('Vă așteptăm din nou la Restaurant Kon Tiki!'), { align: 'center' });

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
