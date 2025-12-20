'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop all existing tables first (in reverse dependency order)
    await queryInterface.dropTable('designs_images');
    await queryInterface.dropTable('designs_diamond_details');
    await queryInterface.dropTable('designs');

    await queryInterface.dropTable('category_masters');
    await queryInterface.dropTable('cut_masters');
    await queryInterface.dropTable('diamond_masters');
    await queryInterface.dropTable('style_masters');

    await queryInterface.dropTable('gold_colors');
    await queryInterface.dropTable('karats');
    await queryInterface.dropTable('metal_rate_masters');
    await queryInterface.dropTable('metals');

    // Create all tables (in dependency order)

    // 1. Languages (no dependencies)
    await queryInterface.createTable('languages', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      language_name: { type: Sequelize.STRING(255), allowNull: false },
      language_code: { type: Sequelize.STRING(255), allowNull: false },
    });

    // Insert initial language values
    await queryInterface.bulkInsert('languages', [
      { language_name: 'English', language_code: 'EN' },
      { language_name: 'Finnish', language_code: 'FI' },
    ]);

    // 7. Categories (no dependencies)
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      category_name: { type: Sequelize.STRING(255), allowNull: false },
      category_code: { type: Sequelize.STRING(255), allowNull: false },
      image: { type: Sequelize.STRING(255), allowNull: true },
    });
    await queryInterface.bulkInsert('categories', [
      { category_name: 'Rings', category_code: 'RG' },
      { category_name: 'Bracelets', category_code: 'BR' },
      { category_name: 'Necklaces and Pendants', category_code: 'NL' },
      { category_name: 'Earrings', category_code: 'ER' },
    ]);

    // 8. Sub Categories (depends on categories)
    await queryInterface.createTable('sub_categories', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      sub_category_name: { type: Sequelize.STRING(255), allowNull: false },
      sub_category_code: { type: Sequelize.STRING(255), allowNull: false },
      category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    });
    await queryInterface.bulkInsert('sub_categories', [
      { sub_category_name: 'Alliance', sub_category_code: 'AL', category_id: 1 },
      { sub_category_name: 'Solitaires', sub_category_code: 'SL', category_id: 1 },
      { sub_category_name: '3 Stones', sub_category_code: '3S', category_id: 1 },
      { sub_category_name: 'Fancy', sub_category_code: 'FC', category_id: 1 },
      { sub_category_name: 'Fancy Stones', sub_category_code: 'FS', category_id: 1 },
      { sub_category_name: 'Halo', sub_category_code: 'HL', category_id: 1 },
      { sub_category_name: "Men's Rings", sub_category_code: 'MR', category_id: 1 },
      { sub_category_name: 'Wedding Bands', sub_category_code: 'WB', category_id: 1 },
    ]);
    // 9. Style Masters (depends on categories and sub_categories)
    await queryInterface.createTable('style_masters', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      style_name: { type: Sequelize.STRING(255), allowNull: false },
      style_code: { type: Sequelize.STRING(255), allowNull: false },
      category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    });

    // Insert style_masters records
    await queryInterface.bulkInsert('style_masters', [
      // Alliance styles (sub_category_id: 1)
      { style_name: 'Lumo', style_code: 'AL-LU', category_id: 1, sub_category_id: 1 },
      { style_name: 'Kastahelmi', style_code: 'AL-KA', category_id: 1, sub_category_id: 1 },
      { style_name: 'Emerald', style_code: 'AL-EM', category_id: 1, sub_category_id: 1 },
      { style_name: 'Classic', style_code: 'AL-CL', category_id: 1, sub_category_id: 1 },
      { style_name: 'Closed Setting Migrain', style_code: 'AL-CSM', category_id: 1, sub_category_id: 1 },
      { style_name: 'Wave', style_code: 'AL-WV', category_id: 1, sub_category_id: 1 },
      { style_name: 'Kuura Slim', style_code: 'AL-KS', category_id: 1, sub_category_id: 1 },
      { style_name: 'Kielo', style_code: 'AL-KI', category_id: 1, sub_category_id: 1 },

      // Solitaire styles (sub_category_id: 2)
      { style_name: 'Classic', style_code: 'SL-CL', category_id: 1, sub_category_id: 2 },
      { style_name: 'Classic Trim', style_code: 'SL-CT', category_id: 1, sub_category_id: 2 },
      { style_name: 'Forest', style_code: 'SL-FO', category_id: 1, sub_category_id: 2 },

      // 3 Stone styles (sub_category_id: 3)
      { style_name: 'Three Crowns', style_code: '3S-TC', category_id: 1, sub_category_id: 3 },
      { style_name: 'Trio', style_code: '3S-TR', category_id: 1, sub_category_id: 3 },
      { style_name: 'Kolme Garden', style_code: '3S-KG', category_id: 1, sub_category_id: 3 },

      // Fancy styles (sub_category_id: 4)
      { style_name: 'Aalto', style_code: 'FC-AA', category_id: 1, sub_category_id: 4 },
      { style_name: 'Olive', style_code: 'FC-OL', category_id: 1, sub_category_id: 4 },
      { style_name: 'Vare', style_code: 'FC-VA', category_id: 1, sub_category_id: 4 },
      { style_name: 'Silk', style_code: 'FC-SI', category_id: 1, sub_category_id: 4 },
      { style_name: 'Verso', style_code: 'FC-VE', category_id: 1, sub_category_id: 4 },
      { style_name: 'Puro', style_code: 'FC-PU', category_id: 1, sub_category_id: 4 },
      { style_name: 'Tiara', style_code: 'FC-TI', category_id: 1, sub_category_id: 4 },

      // Fancy Stone styles (sub_category_id: 5)
      { style_name: 'Crown', style_code: 'FS-CR', category_id: 1, sub_category_id: 5 },
      { style_name: 'Garden Crown', style_code: 'FS-GC', category_id: 1, sub_category_id: 5 },
      { style_name: 'Forest Flower', style_code: 'FS-FF', category_id: 1, sub_category_id: 5 },
      { style_name: 'Edina', style_code: 'FS-ED', category_id: 1, sub_category_id: 5 },

      // Halo styles (sub_category_id: 6)
      { style_name: 'Kukka', style_code: 'HL-KU', category_id: 1, sub_category_id: 6 },
      { style_name: 'Royale', style_code: 'HL-RO', category_id: 1, sub_category_id: 6 },
      { style_name: 'Flower Glow', style_code: 'HL-FG', category_id: 1, sub_category_id: 6 },

      // Men's Ring styles (sub_category_id: 7)
      { style_name: 'Admiral', style_code: 'MR-AD', category_id: 1, sub_category_id: 7 },
      { style_name: 'Paladin', style_code: 'MR-PA', category_id: 1, sub_category_id: 7 },
      { style_name: 'Razor', style_code: 'MR-RA', category_id: 1, sub_category_id: 7 },
      { style_name: 'Mariner', style_code: 'MR-MA', category_id: 1, sub_category_id: 7 },

      // Wedding Band styles (sub_category_id: 8)
      { style_name: 'Forest Diamond', style_code: 'WB-FD', category_id: 1, sub_category_id: 8 },
      { style_name: 'Forest Leaf', style_code: 'WB-FL', category_id: 1, sub_category_id: 8 },
    ]);


    // 10. Products (depends on categories, sub_categories, style_masters)
    await queryInterface.createTable('products', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      style_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      image: { type: Sequelize.STRING(255), allowNull: false },
      is_display: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
    });

    // 11. Cut Masters (no dependencies)
    await queryInterface.createTable('cut_masters', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      cut_name: { type: Sequelize.STRING(255), allowNull: false },
      cut_code: { type: Sequelize.STRING(255), allowNull: false },
      cut_image: { type: Sequelize.STRING(255), allowNull: true },
    });
    await queryInterface.bulkInsert('cut_masters', [
      { cut_name: 'Round', cut_code: 'RD' },
      { cut_name: 'Princess', cut_code: 'PR' },
      { cut_name: 'Emerald', cut_code: 'EM' },
      { cut_name: 'Heart', cut_code: 'HR' },
      { cut_name: 'Oval', cut_code: 'OL' },
      { cut_name: 'Marquise', cut_code: 'MQ' },
      { cut_name: 'Pear', cut_code: 'PE' },
    ]);

    // 12. Diamond Clarities (no dependencies)
    await queryInterface.createTable('diamond_clarities', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      clarity: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('diamond_clarities', [
      { clarity: 'FVS' },
      { clarity: 'FVVS' },
      { clarity: 'HIS' },
    ]);

    // 13. Diamond Types (no dependencies)
    await queryInterface.createTable('diamond_types', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      type_name: { type: Sequelize.STRING(255), allowNull: false },
      type_code: { type: Sequelize.STRING(255), allowNull: false },
    });

    await queryInterface.bulkInsert('diamond_types', [
      { type_name: 'Natural brilliat', type_code: 'NBS' },
      { type_name: 'Lab Brilliant', type_code: 'LBS' },
      { type_name: 'Stone', type_code: 'STS' },
    ]);

    // 14. Diamond Masters (no dependencies)
    await queryInterface.createTable('diamond_masters', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      carat: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      size_from: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      size_to: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.bulkInsert('diamond_masters', [
      { carat: 0.005, size_from: 0.80, size_to: 1.25 },
      { carat: 0.0085, size_from: 1.25, size_to: 1.30 },
      { carat: 0.01, size_from: 1.30, size_to: 1.40 },
      { carat: 0.015, size_from: 1.40, size_to: 1.50 },
      { carat: 0.018, size_from: 1.50, size_to: 1.60 },
      { carat: 0.02, size_from: 1.60, size_to: 1.70 },
      { carat: 0.025, size_from: 1.70, size_to: 1.80 },
      { carat: 0.028, size_from: 1.80, size_to: 1.90 },
      { carat: 0.03, size_from: 1.95, size_to: 2.05 },
      { carat: 0.04, size_from: 2.10, size_to: 2.20 },
      { carat: 0.045, size_from: 2.20, size_to: 2.30 },
      { carat: 0.05, size_from: 2.30, size_to: 2.40 },
      { carat: 0.055, size_from: 2.40, size_to: 2.50 },
      { carat: 0.06, size_from: 2.50, size_to: 2.60 },
      { carat: 0.07, size_from: 2.60, size_to: 2.70 },
      { carat: 0.08, size_from: 2.70, size_to: 2.80 },
      { carat: 0.09, size_from: 2.80, size_to: 2.90 },
      { carat: 0.1, size_from: 2.95, size_to: 3.05 },
      { carat: 0.12, size_from: 3.10, size_to: 3.20 },
      { carat: 0.13, size_from: 3.20, size_to: 3.30 },
      { carat: 0.15, size_from: 3.30, size_to: 3.40 },
      { carat: 0.16, size_from: 3.40, size_to: 3.50 },
      { carat: 0.17, size_from: 3.50, size_to: 3.60 },
      { carat: 0.18, size_from: 3.60, size_to: 3.70 },
      { carat: 0.2, size_from: 3.70, size_to: 3.80 },
      { carat: 0.22, size_from: 3.80, size_to: 3.90 },
      { carat: 0.24, size_from: 3.95, size_to: 4.10 },
    ]);

    // 15. Diamond Rates (depends on diamond_masters, diamond_types, diamond_clarities)
    await queryInterface.createTable('diamond_rates', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      diamond_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      diamond_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      clarity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.bulkInsert('diamond_rates', [
      // For carat 0.005 (diamond_master_id: 1)
      { diamond_master_id: 1, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 1, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 1, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 1, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 1, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.0085 (diamond_master_id: 2)
      { diamond_master_id: 2, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 2, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 2, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 2, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 2, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.01 (diamond_master_id: 3)
      { diamond_master_id: 3, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 3, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 3, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 3, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 3, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.015 (diamond_master_id: 4)
      { diamond_master_id: 4, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 4, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 4, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 4, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 4, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.018 (diamond_master_id: 5)
      { diamond_master_id: 5, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 5, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 5, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 5, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 5, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.02 (diamond_master_id: 6)
      { diamond_master_id: 6, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 6, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 6, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 6, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 6, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.025 (diamond_master_id: 7)
      { diamond_master_id: 7, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 7, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 7, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 7, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 7, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.028 (diamond_master_id: 8)
      { diamond_master_id: 8, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 8, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 8, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 8, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 8, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.03 (diamond_master_id: 9)
      { diamond_master_id: 9, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 9, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 9, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 9, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 9, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.04 (diamond_master_id: 10)
      { diamond_master_id: 10, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 10, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 10, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 10, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 10, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.045 (diamond_master_id: 11)
      { diamond_master_id: 11, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 11, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 11, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 11, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 11, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.05 (diamond_master_id: 12)
      { diamond_master_id: 12, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 12, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 12, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 12, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 12, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.055 (diamond_master_id: 13)
      { diamond_master_id: 13, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 13, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 13, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 13, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 13, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.06 (diamond_master_id: 14)
      { diamond_master_id: 14, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 14, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 14, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 14, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 14, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.07 (diamond_master_id: 15)
      { diamond_master_id: 15, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 15, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 15, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 15, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 15, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.08 (diamond_master_id: 16)
      { diamond_master_id: 16, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 16, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 16, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 16, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 16, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.09 (diamond_master_id: 17)
      { diamond_master_id: 17, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 17, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 17, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 17, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 17, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.1 (diamond_master_id: 18)
      { diamond_master_id: 18, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 18, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 18, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 18, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 18, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.12 (diamond_master_id: 19)
      { diamond_master_id: 19, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 19, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 19, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 19, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 19, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.13 (diamond_master_id: 20)
      { diamond_master_id: 20, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 20, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 20, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 20, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 20, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.15 (diamond_master_id: 21)
      { diamond_master_id: 21, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 21, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 21, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 21, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 21, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.16 (diamond_master_id: 22)
      { diamond_master_id: 22, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 22, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 22, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 22, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 22, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.17 (diamond_master_id: 23)
      { diamond_master_id: 23, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 23, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 23, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 23, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 23, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.18 (diamond_master_id: 24)
      { diamond_master_id: 24, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 24, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 24, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 24, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 24, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.2 (diamond_master_id: 25)
      { diamond_master_id: 25, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 25, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 25, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 25, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 25, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.22 (diamond_master_id: 26)
      { diamond_master_id: 26, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 26, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 26, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 26, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 26, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
      // For carat 0.24 (diamond_master_id: 27)
      { diamond_master_id: 27, diamond_type_id: 1, clarity_id: 1, rate: 324 }, // Natural, FVS
      { diamond_master_id: 27, diamond_type_id: 1, clarity_id: 2, rate: 356 }, // Natural, FVVS
      { diamond_master_id: 27, diamond_type_id: 1, clarity_id: 3, rate: 227 }, // Natural, HIS
      { diamond_master_id: 27, diamond_type_id: 2, clarity_id: 2, rate: 166 }, // Lab, FVVS
      { diamond_master_id: 27, diamond_type_id: 3, clarity_id: 2, rate: 168 }, // Stone, FVVS
    ]);


    // 17. Metals (no dependencies)
    await queryInterface.createTable('metals', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      metal_name: { type: Sequelize.STRING(255), allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.bulkInsert('metals', [
      { metal_name: 'Yellow Gold' },
      { metal_name: 'Rose Gold' },
      { metal_name: 'White Gold' },
      { metal_name: 'Platinum' },
    ]);


    // 18. Karats (no dependencies)
    await queryInterface.createTable('karats', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      karat: { type: Sequelize.STRING(255), allowNull: true },
    });
    await queryInterface.bulkInsert('karats', [
      { karat: '14KT' },
      { karat: '18KT' },
      { karat: '950PT' },
    ]);

    // 19. Metal Rate Masters (depends on karats and metals)
    await queryInterface.createTable('metal_rate_masters', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      metal_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      karat_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
      date: { type: Sequelize.DATEONLY, allowNull: false },
    });
    await queryInterface.bulkInsert('metal_rate_masters', [
      { metal_id: 1, karat_id: 1, rate: 100, date: '2025-12-20' },
      { metal_id: 1, karat_id: 2, rate: 100, date: '2025-12-20' },
      { metal_id: 2, karat_id: 1, rate: 100, date: '2025-12-20' },
      { metal_id: 2, karat_id: 2, rate: 100, date: '2025-12-20' },
      { metal_id: 3, karat_id: 1, rate: 100, date: '2025-12-20' },
      { metal_id: 3, karat_id: 2, rate: 100, date: '2025-12-20' },
    ]);

    // 20. Designs (depends on products, categories, sub_categories, metal_rate_masters, diamond_rates, gold_colors)
    await queryInterface.createTable('designs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
      category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      metal_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      diamond_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      metal_weight: { type: Sequelize.FLOAT, allowNull: false },
      mark_up: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      description: { type: Sequelize.TEXT, allowNull: true },
      gold_color_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    });

    // 21. Designs Diamond Details (depends on designs, cut_masters, diamond_masters)
    await queryInterface.createTable('designs_diamond_details', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      diamond_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      pcs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });

    // 22. Designs Images (depends on designs)
    await queryInterface.createTable('designs_images', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      image_name: { type: Sequelize.STRING(255), allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse dependency order
    // Drop dependent tables first
    await queryInterface.dropTable('designs_images');
    await queryInterface.dropTable('designs_diamond_details');
    await queryInterface.dropTable('designs');
    await queryInterface.dropTable('products');

    // Drop tables with dependencies
    await queryInterface.dropTable('metal_rate_masters');
    await queryInterface.dropTable('diamond_rates');
    await queryInterface.dropTable('style_masters');
    await queryInterface.dropTable('sub_categories');

    // Drop independent tables
    await queryInterface.dropTable('cut_masters');
    await queryInterface.dropTable('diamond_clarities');
    await queryInterface.dropTable('diamond_types');
    await queryInterface.dropTable('diamond_masters');
    await queryInterface.dropTable('metals');
    await queryInterface.dropTable('karats');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('languages');
  },
};
