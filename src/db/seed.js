/**
 * src/db/seed.js
 * Script de populare inițială a bazei de date SQLite pentru Restaurant Kon Tiki.
 * Conține meniul complet real din "Meniu Kon Tiki.jpg", lista de alergeni și cele 12 mese.
 */

const RestaurantDB = require('./database');

function seedDatabase(dbPath) {
  const dbWrapper = new RestaurantDB(dbPath);
  const db = dbWrapper.db;

  console.log('Seeding meniul complet real al Restaurantului Kon Tiki...');

  // Curățare date existente
  db.exec(`
    DELETE FROM resource_slots;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM payments;
    DELETE FROM dish_extras;
    DELETE FROM recipe_items;
    DELETE FROM dishes;
    DELETE FROM ingredients;
    DELETE FROM tables;
  `);

  // 1. Inserare 12 Mese (1 - 12)
  const insertTable = db.prepare(`
    INSERT INTO tables (table_number, status, qr_code_url)
    VALUES (?, 'liberă', ?)
  `);
  for (let i = 1; i <= 12; i++) {
    insertTable.run(i, `/client-menu.html?masa=${i}`);
  }

  // 2. Inserare Ingrediente & Stocuri
  const insertIngredient = db.prepare(`
    INSERT INTO ingredients (id, name, unit, current_stock, min_threshold)
    VALUES (?, ?, ?, ?, ?)
  `);

  const ingredients = [
    { id: 'burta_vita', name: 'Burtă de vită', unit: 'porție', stock: 60, min: 10 },
    { id: 'carne_porc', name: 'Carne de porc', unit: 'porție', stock: 80, min: 10 },
    { id: 'carne_vita', name: 'Carne de vită / mânzat', unit: 'porție', stock: 50, min: 8 },
    { id: 'carne_pui', name: 'Carne de pui', unit: 'porție', stock: 90, min: 15 },
    { id: 'carne_oaie', name: 'Carne de oaie / pastramă', unit: 'porție', stock: 40, min: 5 },
    { id: 'peste_salau', name: 'Șalău proaspăt', unit: 'porție', stock: 40, min: 5 },
    { id: 'peste_pastrav', name: 'Păstrăv proaspăt', unit: 'porție', stock: 40, min: 5 },
    { id: 'mititei_carne', name: 'Pastă mici', unit: 'bucată', stock: 150, min: 20 },
    { id: 'smantana', name: 'Smântână', unit: 'cupă', stock: 200, min: 20 },
    { id: 'otet', name: 'Oțet', unit: 'cupă', stock: 150, min: 15 },
    { id: 'usturoi_otet', name: 'Usturoi / mujdei', unit: 'cupă', stock: 150, min: 15 },
    { id: 'paine', name: 'Pâine / coșuleț', unit: 'coșuleț', stock: 120, min: 20 },
    { id: 'ardei_iute', name: 'Ardei proaspeți / murați', unit: 'bucată', stock: 180, min: 25 },
    { id: 'cartofi', name: 'Cartofi', unit: 'porție', stock: 250, min: 30 },
    { id: 'branza', name: 'Brânză / telemea / cașcaval', unit: 'porție', stock: 120, min: 15 },
    { id: 'mix_legume', name: 'Mix legume', unit: 'porție', stock: 140, min: 15 },
    { id: 'fasole', name: 'Fasole boabe', unit: 'porție', stock: 70, min: 10 },
    { id: 'oua', name: 'Ouă proaspete', unit: 'bucată', stock: 100, min: 15 },
    { id: 'faina_pesmet', name: 'Făină / pesmet', unit: 'porție', stock: 100, min: 10 },
    { id: 'bauturi_generice', name: 'Băuturi răcoritoare / bere / vin', unit: 'bucată', stock: 300, min: 30 },
    { id: 'desert_ingrediente', name: 'Ingrediente deserturi', unit: 'porție', stock: 100, min: 15 }
  ];

  for (const ing of ingredients) {
    insertIngredient.run(ing.id, ing.name, ing.unit, ing.stock, ing.min);
  }

  // 3. Inserare Toate Preparatele din Meniul Oficial Kon Tiki (cu gramaj și alergeni)
  const insertDish = db.prepare(`
    INSERT INTO dishes (id, name, category, price, weight, allergens)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const dishes = [
    // --- CIORBE ---
    { id: 'ciorba_burta', name: 'Ciorbă de burtă', category: 'Ciorbe', price: 24.00, weight: '100/300g', allergens: [1, 3, 7, 9, 15], ing: 'burta_vita' },
    { id: 'ciorba_porc_ardeleneasca', name: 'Ciorbă de porc ardelenească', category: 'Ciorbe', price: 18.00, weight: '40/360g', allergens: [1, 3, 7, 15], ing: 'carne_porc' },
    { id: 'ciorba_perisoare', name: 'Ciorbă de perișoare a la Grec', category: 'Ciorbe', price: 18.00, weight: '60/340g', allergens: [1, 3, 7, 9, 15], ing: 'carne_porc' },
    { id: 'ciorba_vacuta', name: 'Ciorbă țărănească de văcuță', category: 'Ciorbe', price: 18.00, weight: '40/360g', allergens: [9, 15], ing: 'carne_vita' },
    { id: 'ciorba_legume', name: 'Ciorbă țărănească de legume', category: 'Ciorbe', price: 14.00, weight: '400g', allergens: [9, 15], ing: 'mix_legume' },
    { id: 'ciorba_pui', name: 'Ciorbă țărănească de pui', category: 'Ciorbe', price: 18.00, weight: '40/360g', allergens: [9, 15], ing: 'carne_pui' },
    { id: 'ciorba_fasole_costita', name: 'Ciorbă de fasole cu costiță', category: 'Ciorbe', price: 18.00, weight: '40/360g', allergens: [6, 7, 15], ing: 'fasole' },
    { id: 'ciorba_fasole', name: 'Ciorbă de fasole', category: 'Ciorbe', price: 14.00, weight: '400g', allergens: [9], ing: 'fasole' },

    // --- PUI ---
    { id: 'piept_pui_gratar', name: 'Piept de pui la grătar', category: 'Preparate Pui', price: 25.00, weight: '90 g', allergens: [15], ing: 'carne_pui' },
    { id: 'pulpa_dezosata_gratar', name: 'Pulpă dezosată la grătar', category: 'Preparate Pui', price: 25.00, weight: '140 g', allergens: [15], ing: 'carne_pui' },
    { id: 'snitel_pane_pui', name: 'Șnițel pane (carne de pui, ou, făină, pesmet)', category: 'Preparate Pui', price: 30.00, weight: '140 g', allergens: [1, 3, 15], ing: 'carne_pui' },
    { id: 'snitel_parizian_pui', name: 'Șnițel parizian (carne de pui, ou, făină)', category: 'Preparate Pui', price: 30.00, weight: '140 g', allergens: [1, 3, 15], ing: 'carne_pui' },
    { id: 'ficatei_pui', name: 'Ficăței de pui', category: 'Preparate Pui', price: 25.00, weight: '100 g', allergens: [15], ing: 'carne_pui' },
    { id: 'crispy_pui', name: 'Crispy de pui', category: 'Preparate Pui', price: 35.00, weight: '140 g', allergens: [1, 3, 15], ing: 'carne_pui' },

    // --- VITĂ ---
    { id: 'muschi_vita_gratar', name: 'Mușchi de vită la grătar', category: 'Preparate Vită', price: 35.00, weight: '100 g', allergens: [7, 15], ing: 'carne_vita' },
    { id: 'muschi_ciobanesc', name: 'Mușchi ciobănesc', category: 'Preparate Vită', price: 55.00, weight: '250 g', allergens: [1, 3, 7, 15], ing: 'carne_vita' },
    { id: 'creier_pane', name: 'Creier pane (creier, făină, ou, pesmet)', category: 'Preparate Vită', price: 25.00, weight: '140 g', allergens: [1, 3, 15], ing: 'faina_pesmet' },
    { id: 'creier_ou_ceapa', name: 'Creier cu ou și ceapă', category: 'Preparate Vită', price: 25.00, weight: '140 g', allergens: [3, 15], ing: 'oua' },
    { id: 'fudulii_manzat_gratar', name: 'Fudulii de mânzat la grătar', category: 'Preparate Vită', price: 30.00, weight: '150 g', allergens: [15], ing: 'carne_vita' },
    { id: 'gulas', name: 'Gulaș', category: 'Preparate Vită', price: 30.00, weight: '300 g', allergens: [1, 3, 9, 15], ing: 'carne_vita' },

    // --- PORC ---
    { id: 'cotlet_gratar', name: 'Cotlet la grătar', category: 'Preparate Porc', price: 25.00, weight: '90 g', allergens: [15], ing: 'carne_porc' },
    { id: 'ceafa_gratar', name: 'Ceafă la grătar', category: 'Preparate Porc', price: 25.00, weight: '90 g', allergens: [15], ing: 'carne_porc' },
    { id: 'ceafa_afumata_gratar', name: 'Ceafă afumată la grătar', category: 'Preparate Porc', price: 25.00, weight: '140 g', allergens: [15], ing: 'carne_porc' },
    { id: 'snitel_pane_porc', name: 'Șnițel pane (carne de porc, ou, făină, pesmet)', category: 'Preparate Porc', price: 30.00, weight: '120 g', allergens: [1, 3, 15], ing: 'carne_porc' },
    { id: 'cordon_bleu', name: 'Cordon Bleu (porc, șuncă, cașcaval, ou, făină, pesmet)', category: 'Preparate Porc', price: 32.00, weight: '150 g', allergens: [1, 3, 7, 15], ing: 'carne_porc' },
    { id: 'muschi_sibian', name: 'Mușchi sibian (porc, șuncă, cașcaval, ciuperci)', category: 'Preparate Porc', price: 37.00, weight: '200 g', allergens: [1, 7, 15], ing: 'carne_porc' },
    { id: 'ficat_porc', name: 'Ficat de porc', category: 'Preparate Porc', price: 25.00, weight: '105 g', allergens: [1, 15], ing: 'carne_porc' },
    { id: 'ciolan_dezosat', name: 'Ciolan dezosat cu mămăliguță', category: 'Preparate Porc', price: 36.00, weight: '400 g', allergens: [1, 6, 7, 9, 10, 12, 15], ing: 'carne_porc' },
    { id: 'tochitura_mamaliguta', name: 'Tochitură cu mămăliguță (porc, cârnat, brânză, mămăligă, ou)', category: 'Preparate Porc', price: 36.00, weight: '200 g', allergens: [3, 7, 12, 15], ing: 'carne_porc' },
    { id: 'carnat_subtire', name: 'Cârnat subțire', category: 'Preparate Porc', price: 25.00, weight: '100 g', allergens: [15], ing: 'carne_porc' },

    // --- ALTE PREPARATE ---
    { id: 'cascaval_pane', name: 'Cașcaval pane (cașcaval, făină, ou, pesmet)', category: 'Alte Preparate', price: 20.00, weight: '100g', allergens: [1, 3, 7], ing: 'branza' },
    { id: 'mititei', name: 'Mititei (1 bucată)', category: 'Alte Preparate', price: 7.00, weight: '50g', allergens: [1, 15], ing: 'mititei_carne' },
    { id: 'crenvursti', name: 'Crenvurști', category: 'Alte Preparate', price: 10.00, weight: '100g', allergens: [15], ing: 'carne_porc' },
    { id: 'mamaliguta_branza_smantana', name: 'Mămăliguță cu brânză și smântână', category: 'Alte Preparate', price: 22.00, weight: '150/100/80g', allergens: [7], ing: 'branza' },
    { id: 'gustare_calda', name: 'Gustare caldă (șnițel pui, cașcaval pane, ficăței pui, creier, cârnat, mititei)', category: 'Alte Preparate', price: 65.00, weight: '60/50/50/70/70/50g', allergens: [1, 3, 7, 15], ing: 'carne_porc' },
    { id: 'sarmale_costita', name: 'Sarmale cu costiță și mămăliguță', category: 'Alte Preparate', price: 35.00, weight: '400g', allergens: [15], ing: 'carne_porc' },

    // --- PEȘTE & OAIE ---
    { id: 'salau_parizian', name: 'Șalău parizian', category: 'Pește', price: 35.00, weight: '150g', allergens: [1, 3, 4, 15], ing: 'peste_salau' },
    { id: 'salau_fulgi', name: 'Șalău în fulgi', category: 'Pește', price: 40.00, weight: '150g', allergens: [1, 3, 4, 15], ing: 'peste_salau' },
    { id: 'pastrav_gratar', name: 'Păstrăv la grătar', category: 'Pește', price: 40.00, weight: '200 g', allergens: [1, 4, 7, 15], ing: 'peste_pastrav' },
    { id: 'pastrama_oaie', name: 'Pastramă de oaie', category: 'Oaie', price: 35.00, weight: '200 g', allergens: [15], ing: 'carne_oaie' },
    { id: 'virsli', name: 'Virșli', category: 'Oaie', price: 25.00, weight: '100 g', allergens: [15], ing: 'carne_oaie' },

    // --- GARNITURI ---
    { id: 'cartofi_prajiti_orez', name: 'Cartofi prăjiți și pilaf de orez', category: 'Garnituri', price: 10.00, weight: '100/50g', allergens: [9, 15], ing: 'cartofi' },
    { id: 'cartofi_natur', name: 'Cartofi natur', category: 'Garnituri', price: 10.00, weight: '150g', allergens: [], ing: 'cartofi' },
    { id: 'cartofi_ceapa', name: 'Cartofi cu ceapă', category: 'Garnituri', price: 10.00, weight: '150g', allergens: [9, 15], ing: 'cartofi' },
    { id: 'cartofi_taranesti', name: 'Cartofi țărănești (cartofi, ceapă, costiță)', category: 'Garnituri', price: 12.00, weight: '150g', allergens: [6, 7, 15], ing: 'cartofi' },
    { id: 'legume_gratar', name: 'Legume la grătar', category: 'Garnituri', price: 16.00, weight: '300g', allergens: [15], ing: 'mix_legume' },
    { id: 'piure_cartofi', name: 'Piure de cartofi', category: 'Garnituri', price: 12.00, weight: '150g', allergens: [7], ing: 'cartofi' },
    { id: 'legume_mexicane', name: 'Legume mexicane', category: 'Garnituri', price: 12.00, weight: '150g', allergens: [15], ing: 'mix_legume' },
    { id: 'ciuperci_sote', name: 'Ciuperci sote', category: 'Garnituri', price: 15.00, weight: '150g', allergens: [9], ing: 'mix_legume' },
    { id: 'iahnie_fasole', name: 'Iahnie de fasole', category: 'Garnituri', price: 15.00, weight: '200g', allergens: [], ing: 'fasole' },
    { id: 'varza_calita', name: 'Varză călită', category: 'Garnituri', price: 15.00, weight: '200g', allergens: [], ing: 'mix_legume' },
    { id: 'garnitura_post', name: 'Garnitură de post', category: 'Garnituri', price: 25.00, weight: '300g', allergens: [7, 9, 15], ing: 'mix_legume' },
    { id: 'cartofi_branza', name: 'Cartofi cu brânză rasă', category: 'Garnituri', price: 16.00, weight: '150g', allergens: [7], ing: 'cartofi' },

    // --- SALATE ---
    { id: 'salata_gogosari', name: 'Salată de gogoșari', category: 'Salate', price: 8.00, weight: '200g', allergens: [9], ing: 'mix_legume' },
    { id: 'salata_varza', name: 'Salată de varză', category: 'Salate', price: 8.00, weight: '200g', allergens: [], ing: 'mix_legume' },
    { id: 'salata_castraveti', name: 'Salată de castraveți', category: 'Salate', price: 8.00, weight: '200g', allergens: [9], ing: 'mix_legume' },
    { id: 'salata_rosii', name: 'Salată de roșii', category: 'Salate', price: 8.00, weight: '200g', allergens: [], ing: 'mix_legume' },
    { id: 'salata_asortata_verde', name: 'Salată asortată verde (roșii, castraveți, varză, ceapă)', category: 'Salate', price: 8.00, weight: '200g', allergens: [], ing: 'mix_legume' },
    { id: 'salata_gogonele', name: 'Salată de gogonele', category: 'Salate', price: 8.00, weight: '200g', allergens: [9], ing: 'mix_legume' },
    { id: 'salata_gogosari_conopida', name: 'Salată de gogoșari cu conopidă', category: 'Salate', price: 8.00, weight: '200g', allergens: [9], ing: 'mix_legume' },
    { id: 'salata_asortata_muraturi', name: 'Salată asortată de murături', category: 'Salate', price: 8.00, weight: '200g', allergens: [9], ing: 'mix_legume' },
    { id: 'salata_ardei_copt', name: 'Salată de ardei copt', category: 'Salate', price: 8.00, weight: '200g', allergens: [], ing: 'mix_legume' },

    // --- DESERT ---
    { id: 'clatite_gem', name: 'Clătite cu gem', category: 'Desert', price: 15.00, weight: '120g', allergens: [1, 3, 7], ing: 'desert_ingrediente' },
    { id: 'clatite_finetti', name: 'Clătite cu Finetti', category: 'Desert', price: 15.00, weight: '120g', allergens: [1, 3, 7, 8], ing: 'desert_ingrediente' },
    { id: 'clatite_cascaval', name: 'Clătite cu cașcaval', category: 'Desert', price: 20.00, weight: '120g', allergens: [1, 3, 7], ing: 'desert_ingrediente' },
    { id: 'clatite_branza', name: 'Clătite cu brânză', category: 'Desert', price: 20.00, weight: '120g', allergens: [1, 3, 7], ing: 'desert_ingrediente' },
    { id: 'tiramisu', name: 'Tiramisu', category: 'Desert', price: 20.00, weight: '200g', allergens: [1, 3, 7], ing: 'desert_ingrediente' },
    { id: 'papanasi', name: 'Papanași', category: 'Desert', price: 20.00, weight: '200g', allergens: [1, 3, 7], ing: 'desert_ingrediente' },
    { id: 'inghetata', name: 'Înghețată', category: 'Desert', price: 15.00, weight: '150g', allergens: [7], ing: 'desert_ingrediente' },

    // --- BĂUTURI RĂCORITOARE ---
    { id: 'apa_plata_500', name: 'Apă minerală plată (PET)', category: 'Băuturi Răcoritoare', price: 7.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'apa_carbogazoasa_500', name: 'Apă minerală carbogazoasă (PET)', category: 'Băuturi Răcoritoare', price: 7.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'apa_carbogazoasa_sticla_500', name: 'Apă minerală carbogazoasă (Sticlă)', category: 'Băuturi Răcoritoare', price: 6.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'apa_carbogazoasa_sticla_1l', name: 'Apă minerală carbogazoasă (Sticlă)', category: 'Băuturi Răcoritoare', price: 11.00, weight: '1L', allergens: [], ing: 'bauturi_generice' },
    { id: 'coca_cola_500', name: 'Coca-Cola', category: 'Băuturi Răcoritoare', price: 12.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'coca_cola_zero_500', name: 'Coca-Cola Zero', category: 'Băuturi Răcoritoare', price: 12.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'fanta_500', name: 'Fanta', category: 'Băuturi Răcoritoare', price: 12.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'sprite_500', name: 'Sprite', category: 'Băuturi Răcoritoare', price: 12.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'limonada_500', name: 'Limonadă', category: 'Băuturi Răcoritoare', price: 16.00, weight: '500ml', allergens: [], ing: 'bauturi_generice' },

    // --- BERE ---
    { id: 'bere_stella_500', name: 'Stella Artois', category: 'Bere', price: 14.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_stella_na_330', name: 'Stella Artois Fără Alcool', category: 'Bere', price: 14.00, weight: '330ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_becks_500', name: "Beck's", category: 'Bere', price: 12.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_staropramen_500', name: 'Staropramen', category: 'Bere', price: 12.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_tuborg_500', name: 'Tuborg', category: 'Bere', price: 12.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_timisoreana_500', name: 'Timișoreana', category: 'Bere', price: 12.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_ursus_500', name: 'Ursus', category: 'Bere', price: 12.00, weight: '500ml', allergens: [1], ing: 'bauturi_generice' },
    { id: 'bere_corona_330', name: 'Corona', category: 'Bere', price: 22.00, weight: '330ml', allergens: [1], ing: 'bauturi_generice' },

    // --- VIN & CAFEA ---
    { id: 'vinul_casei_1l', name: 'Vinul Casei', category: 'Vin & Cafea', price: 35.00, weight: '1L', allergens: [12], ing: 'bauturi_generice' },
    { id: 'vin_sauvignon_jidvei', name: 'Sauvignon Blanche Jidvei', category: 'Vin & Cafea', price: 45.00, weight: '750ml', allergens: [12], ing: 'bauturi_generice' },
    { id: 'cafea_expresso', name: 'Cafea Expresso', category: 'Vin & Cafea', price: 8.00, weight: '75ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'cafea_filtru', name: 'Cafea la Filtru', category: 'Vin & Cafea', price: 7.00, weight: '100ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'cappuccino', name: 'Capucino (Plic)', category: 'Vin & Cafea', price: 6.00, weight: '150ml', allergens: [7], ing: 'bauturi_generice' },
    { id: 'ceai', name: 'Ceai cald', category: 'Vin & Cafea', price: 6.00, weight: '150ml', allergens: [], ing: 'bauturi_generice' },
    { id: 'latte_macchiato', name: 'Latte Machiatto', category: 'Vin & Cafea', price: 12.00, weight: '150ml', allergens: [7], ing: 'bauturi_generice' },

    // Secțiunea DIVERSE & EXTRA (preparate din meniu ce pot fi comandate și de sine stătător: ardei, smântână, pâine etc.)
    { id: 'diverse_smantana', name: 'Smântână', category: 'Diverse & Extra', price: 4.00, weight: '100g', allergens: [7], ing: 'smantana' },
    { id: 'diverse_ardei_murati', name: 'Ardei murați', category: 'Diverse & Extra', price: 3.00, weight: '2 buc.', allergens: [], ing: 'ardei_iute' },
    { id: 'diverse_ardei_verzi', name: 'Ardei verzi', category: 'Diverse & Extra', price: 3.00, weight: '2 buc.', allergens: [], ing: 'ardei_iute' },
    { id: 'diverse_mujdei', name: 'Mujdei cu usturoi', category: 'Diverse & Extra', price: 2.00, weight: '20g', allergens: [], ing: 'usturoi_otet' },
    { id: 'diverse_paine', name: 'Pâine', category: 'Diverse & Extra', price: 0.40, weight: '1 felie', allergens: [1], ing: 'paine' },
    { id: 'diverse_ceapa_rosie', name: 'Ceapă roșie', category: 'Diverse & Extra', price: 3.00, weight: '50g', allergens: [], ing: 'mix_legume' },
    { id: 'diverse_branza', name: 'Brânză suplimentară', category: 'Diverse & Extra', price: 5.00, weight: '50g', allergens: [7], ing: 'branza' }
  ];

  // Inserare rețete
  const insertRecipe = db.prepare(`
    INSERT INTO recipe_items (dish_id, ingredient_id, quantity, unit)
    VALUES (?, ?, ?, ?)
  `);

  for (const d of dishes) {
    insertDish.run(d.id, d.name, d.category, d.price, d.weight, JSON.stringify(d.allergens));
    
    // Legătură cu ingredientul principal
    if (d.id === 'ciorba_burta') {
      insertRecipe.run(d.id, 'burta_vita', 1, 'porție');
      insertRecipe.run(d.id, 'smantana', 1, 'cupă');
      insertRecipe.run(d.id, 'paine', 1, 'coșuleț');
    } else if (d.id === 'ciorba_vacuta') {
      insertRecipe.run(d.id, 'carne_vita', 1, 'porție');
      insertRecipe.run(d.id, 'mix_legume', 1, 'porție');
      insertRecipe.run(d.id, 'paine', 1, 'coșuleț');
    } else if (d.id === 'cartofi_branza') {
      insertRecipe.run(d.id, 'cartofi', 1, 'porție');
      insertRecipe.run(d.id, 'branza', 1, 'porție');
    } else {
      insertRecipe.run(d.id, d.ing, 1, 'porție');
    }
  }

  // 4. Inserare Opțiuni Extra (din secțiunea DIVERSE a meniului)
  const insertExtra = db.prepare(`
    INSERT INTO dish_extras (id, name, ingredient_id, quantity, price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const extras = [
    { id: 'extra_smantana', name: 'Smântână (100g)', ingredient_id: 'smantana', quantity: 1, price: 4.00 },
    { id: 'extra_paine', name: 'Pâine (1 felie)', ingredient_id: 'paine', quantity: 1, price: 0.40 },
    { id: 'extra_mujdei', name: 'Mujdei cu usturoi (20g)', ingredient_id: 'usturoi_otet', quantity: 1, price: 2.00 },
    { id: 'extra_ceapa_rosie', name: 'Ceapă roșie (50g)', ingredient_id: 'mix_legume', quantity: 1, price: 3.00 },
    { id: 'extra_ardei_murati', name: 'Ardei murați (2 buc.)', ingredient_id: 'ardei_iute', quantity: 2, price: 3.00 },
    { id: 'extra_ardei_verzi', name: 'Ardei verzi (2 buc.)', ingredient_id: 'ardei_iute', quantity: 2, price: 3.00 },
    { id: 'extra_branza', name: 'Brânză suplimentară', ingredient_id: 'branza', quantity: 1, price: 5.00 }
  ];

  for (const ex of extras) {
    insertExtra.run(ex.id, ex.name, ex.ingredient_id, ex.quantity, ex.price);
  }

  console.log(`✓ Seeding finalizat: 12 mese, ${ingredients.length} ingrediente, ${dishes.length} preparate, ${extras.length} extra-uri din meniul real Kon Tiki.`);
  dbWrapper.close();
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
