"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create karats table first (required for foreign key in metal_rate_masters)
    await queryInterface.createTable("karats", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      metal_type: { type: Sequelize.ENUM('Gold', 'silver', 'Platinum'), allowNull: false },
      karat_value: { type: Sequelize.STRING(255), allowNull: true },
      karat: { type: Sequelize.STRING(255), allowNull: true },
    });

    // Insert initial karat records
    await queryInterface.bulkInsert("karats", [
      {
        metal_type: 'Gold',
        karat_value: '14',
        karat: '14KT'
      },
      {
        metal_type: 'Gold',
        karat_value: '18',
        karat: '18KT'
      }
    ]);

    // Create metal_rate_masters table after karats (has foreign key to karats)
    await queryInterface.createTable("metal_rate_masters", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      karat_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
      },
      rate: {
        type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
    });

    await queryInterface.createTable("cut_masters", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      cut_name: { type: Sequelize.STRING(255), allowNull: false },
      cut_code: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert("cut_masters", [
      { cut_name: 'Round', cut_code: 'RD' },
      { cut_name: 'Princess', cut_code: 'PR' },
      { cut_name: 'Emerald', cut_code: 'EM' },
      { cut_name: 'Heart', cut_code: 'HR' },
      { cut_name: 'Oval', cut_code: 'OL' },
      { cut_name: 'Marquise', cut_code: 'MQ' },
      { cut_name: 'Pear', cut_code: 'PE' },
      { cut_name: 'Radiant', cut_code: 'RDN' },
      { cut_name: 'Square', cut_code: 'SQ' },
      { cut_name: 'Triangle', cut_code: 'TR' },
    ]);

    await queryInterface.createTable("style_masters", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      style_name: { type: Sequelize.STRING(255), allowNull: false },
      style_code: { type: Sequelize.STRING(255), allowNull: false },
    });

    // Insert unique styles grouped by style_name with null-safe insert (INSERT IGNORE)
    const uniqueStyles = [
      { style_name: 'Lumo', style_code: 'LM' },
      { style_name: 'Kastahelmi', style_code: 'KH' },
      { style_name: 'Emerald', style_code: 'EM' },
      { style_name: 'Classic', style_code: 'CL' },
      { style_name: 'Closed Setting Migrain', style_code: 'CSM' },
      { style_name: 'Wave', style_code: 'WV' },
      { style_name: 'Kuura Slim', style_code: 'KS' },
      { style_name: 'Kielo', style_code: 'KL' },
      { style_name: 'Classic Trim', style_code: 'CT' },
      { style_name: 'Forest', style_code: 'FR' },
      { style_name: 'Three Crowns', style_code: 'TC' },
      { style_name: 'Trio', style_code: 'TR' },
      { style_name: 'Kolme Garden', style_code: 'KG' },
      { style_name: 'Aalto', style_code: 'AL' },
      { style_name: 'Olive', style_code: 'OL' },
      { style_name: 'Vare', style_code: 'VR' },
      { style_name: 'Silk', style_code: 'SK' },
      { style_name: 'Verso', style_code: 'VS' },
      { style_name: 'Puro', style_code: 'PR' },
      { style_name: 'Tiara', style_code: 'TA' },
      { style_name: 'Crown', style_code: 'CR' },
      { style_name: 'Garden Crown', style_code: 'GC' },
      { style_name: 'Forest Flower', style_code: 'FF' },
      { style_name: 'Edina', style_code: 'ED' },
      { style_name: 'Kukka', style_code: 'KK' },
      { style_name: 'Royale', style_code: 'RY' },
      { style_name: 'Flower Glow', style_code: 'FG' },
      { style_name: 'Admiral', style_code: 'AD' },
      { style_name: 'Paladin', style_code: 'PL' },
      { style_name: 'Razor', style_code: 'RZ' },
      { style_name: 'Mariner', style_code: 'MR' },
      { style_name: 'Forest Diamond', style_code: 'FD' },
      { style_name: 'Forest Leaf', style_code: 'FL' },
    ];

    // Use raw query with INSERT IGNORE to handle duplicates (null-safe insert)
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO style_masters (style_name, style_code) VALUES ${uniqueStyles.map(() => '(?, ?)').join(', ')}`,
      {
        replacements: uniqueStyles.flatMap(style => [style.style_name, style.style_code]),
        type: Sequelize.QueryTypes.INSERT
      }
    );

    await queryInterface.createTable("category_masters", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      category_name: { type: Sequelize.STRING(255), allowNull: false },
      category_code: { type: Sequelize.STRING(255), allowNull: false },
      created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
      updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false, },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // Insert unique categories grouped by category_name with null-safe insert (INSERT IGNORE)
    const uniqueCategories = [
      { category_name: 'Alliance', category_code: 'AL' },
      { category_name: 'Solitaire', category_code: 'SL' },
      { category_name: '3 Stone', category_code: '3S' },
      { category_name: 'Fancy', category_code: 'FC' },
      { category_name: 'Fancy Stone', category_code: 'FS' },
      { category_name: 'Halo', category_code: 'HL' },
      { category_name: "Men's Ring", category_code: 'MR' },
      { category_name: 'Wedding Bands', category_code: 'WB' }, // Fixed typo from "Weddind Bands"
      { category_name: 'Wedding Band', category_code: 'WBD' },
      { category_name: 'Bracelet', category_code: 'BR' },
    ];

    // Use raw query with INSERT IGNORE to handle duplicates (null-safe insert)
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO category_masters (category_name, category_code, created_at, updated_at) VALUES ${uniqueCategories.map(() => '(?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').join(', ')}`,
      {
        replacements: uniqueCategories.flatMap(category => [category.category_name, category.category_code]),
        type: Sequelize.QueryTypes.INSERT
      }
    );
    await queryInterface.createTable("diamond_masters", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      carat: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      size_from: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      size_to: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
      updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false, },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.bulkInsert("diamond_masters", [
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
      { carat: 0.09, size_from: 2.80, size_to: 2.95 },
      { carat: 0.1, size_from: 2.95, size_to: 3.05 },
      { carat: 0.12, size_from: 3.05, size_to: 3.20 },
      { carat: 0.13, size_from: 3.20, size_to: 3.30 },
      { carat: 0.15, size_from: 3.30, size_to: 3.40 },
      { carat: 0.16, size_from: 3.40, size_to: 3.50 },
      { carat: 0.17, size_from: 3.50, size_to: 3.60 },
      { carat: 0.18, size_from: 3.60, size_to: 3.70 },
      { carat: 0.2, size_from: 3.70, size_to: 3.80 },
      { carat: 0.22, size_from: 3.80, size_to: 3.95 },
      { carat: 0.24, size_from: 3.95, size_to: 4.10 },
    ]);
    await queryInterface.createTable("designs", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
      category_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      style_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      karat_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      mark_up: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
      updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false, },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.createTable("designs_diamond_details", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      diamond_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      pcs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });
    await queryInterface.createTable("designs_images", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      image_name: { type: Sequelize.STRING(255), allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (drop dependent table first)
    await queryInterface.dropTable("metal_rate_masters");
    await queryInterface.dropTable("karats");
    await queryInterface.dropTable("cut_masters");
    await queryInterface.dropTable("style_masters");
    await queryInterface.dropTable("category_masters");
    await queryInterface.dropTable("diamond_masters");
    await queryInterface.dropTable("designs");
    await queryInterface.dropTable("designs_diamond_details");
    await queryInterface.dropTable("designs_images");
  },
};

