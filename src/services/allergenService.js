/**
 * src/services/allergenService.js
 * Lista oficială a alergenilor alimentari conform Directivei CE 2000-13 și H.G. 751/2008.
 * Corespunde exact documentului "Lista de alergenii.jpg" din Restaurant Kon Tiki.
 */

const ALLERGENS = [
  {
    id: 1,
    name: 'Cereale care conțin gluten',
    details: 'grâu, secară, orz, ovăz, grâu spelt, grâu mare sau hibrizi ai acestora și produse derivate',
    shortName: 'Gluten'
  },
  {
    id: 2,
    name: 'Crustacee și produse derivate',
    details: 'creveți, raci, crabi, homari și derivate',
    shortName: 'Crustacee'
  },
  {
    id: 3,
    name: 'Ouă și produse derivate',
    details: 'ouă de găină, prepeliță, maioneză, produse de patiserie etc.',
    shortName: 'Ouă'
  },
  {
    id: 4,
    name: 'Pește și produse derivate',
    details: 'toate speciile de pește de apă dulce și marin',
    shortName: 'Pește'
  },
  {
    id: 5,
    name: 'Arahide și produse derivate',
    details: 'arahide (alune de pământ) și produse derivate',
    shortName: 'Arahide'
  },
  {
    id: 6,
    name: 'Soia și produse derivate',
    details: 'boabe de soia, lecitină de soia, sos de soia',
    shortName: 'Soia'
  },
  {
    id: 7,
    name: 'Lapte și produse derivate (inclusiv lactoză)',
    details: 'lapte, smântână, brânză, telemea, cașcaval, unt',
    shortName: 'Lactoză (lapte)'
  },
  {
    id: 8,
    name: 'Fructe cu coajă lemnoasă',
    details: 'migdale, alune de pădure, nuci, nuci Pecan, nuci de Brazilia, fistic, nuci de macadamia',
    shortName: 'Nuci / Alune'
  },
  {
    id: 9,
    name: 'Țelină și produse derivate',
    details: 'rădăcină și frunze de țelină, sare de țelină',
    shortName: 'Țelină'
  },
  {
    id: 10,
    name: 'Muștar și produse derivate',
    details: 'semințe de muștar, pastă de muștar',
    shortName: 'Muștar'
  },
  {
    id: 11,
    name: 'Semințe de susan și produse derivate',
    details: 'semințe de susan, pastă tahini, ulei de susan',
    shortName: 'Susan'
  },
  {
    id: 12,
    name: 'Dioxid de sulf și sulfiți',
    details: 'în concentrații de peste 10 mg/kg sau 10 mg/litru (vinuri, oțet etc.)',
    shortName: 'Sulfiți'
  },
  {
    id: 13,
    name: 'Lupin și produse derivate',
    details: 'făină de lupin, semințe de lupin',
    shortName: 'Lupin'
  },
  {
    id: 14,
    name: 'Moluște și produse derivate',
    details: 'midii, stridii, caracatiță, calamar, melci',
    shortName: 'Moluște'
  },
  {
    id: 15,
    name: 'Produse congelate și refrigerate',
    details: 'materii prime sau semipreparate păstrate la rece conform normelor sanitare',
    shortName: 'Produs congelat/refrigerat'
  }
];

class AllergenService {
  /**
   * Returnează lista completă a celor 15 grupe de alergeni.
   */
  static getAllergensList() {
    return ALLERGENS;
  }

  /**
   * Formatează alergenii pentru un preparat pe baza listei de numere/nume.
   * @param {Array<number|string>} allergenIds - ex. [1, 3, 7, 9, 15]
   * @returns {Array<{ id: number, name: string, shortName: string, details: string }>}
   */
  static resolveAllergens(allergenIds = []) {
    return allergenIds.map(id => {
      const numId = typeof id === 'number' ? id : parseInt(id, 10);
      const found = ALLERGENS.find(a => a.id === numId);
      if (found) return found;
      // Dacă a fost stocat direct ca șir de caractere
      return {
        id: numId || 0,
        name: String(id),
        shortName: String(id),
        details: ''
      };
    });
  }
}

module.exports = AllergenService;
