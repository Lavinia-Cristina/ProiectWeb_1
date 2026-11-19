/**
 * src/services/qrService.js
 * Serviciu server-side pentru generarea codurilor QR ale celor 12 mese (D-005).
 * Utilizează pachetul 'qrcode' pentru a produce imagini PNG DataURL sau Buffer.
 */

const QRCode = require('qrcode');

class QRService {
  /**
   * Generează URL-ul țintă pentru meniul digital al unei mese.
   * @param {number} tableNumber - 1-12
   * @param {string} [baseUrl] - URL-ul de bază al serverului (ex. http://localhost:3000)
   * @returns {string}
   */
  static getTableMenuUrl(tableNumber, baseUrl = '') {
    const cleanBase = baseUrl.replace(/\/$/, '');
    return `${cleanBase}/client-menu.html?masa=${tableNumber}`;
  }

  /**
   * Generează codul QR ca PNG Data URL (base64) pentru afișare directă în <img>.
   * @param {number} tableNumber - 1-12
   * @param {string} [baseUrl]
   * @returns {Promise<string>}
   */
  static async generateTableQRDataURL(tableNumber, baseUrl = '') {
    const url = this.getTableMenuUrl(tableNumber, baseUrl);
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#241e19',  // Conformează cu token-ul --color-text din DESIGN.md
        light: '#ffffff'
      }
    });
  }

  /**
   * Generează codul QR ca Buffer PNG binar.
   * @param {number} tableNumber - 1-12
   * @param {string} [baseUrl]
   * @returns {Promise<Buffer>}
   */
  static async generateTableQRBuffer(tableNumber, baseUrl = '') {
    const url = this.getTableMenuUrl(tableNumber, baseUrl);
    return await QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320
    });
  }

  /**
   * Generează pachetul de coduri QR pentru toate cele 12 mese (pentru afișare și tipărire A4).
   * @param {string} [baseUrl]
   * @returns {Promise<Array<{ table_number: number, url: string, qr_data_url: string }>>}
   */
  static async generateAllTablesQR(baseUrl = '') {
    const list = [];
    for (let i = 1; i <= 12; i++) {
      const url = this.getTableMenuUrl(i, baseUrl);
      const qr_data_url = await this.generateTableQRDataURL(i, baseUrl);
      list.push({
        table_number: i,
        url,
        qr_data_url
      });
    }
    return list;
  }
}

module.exports = QRService;
