'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('style_masters', 'category_master_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
    });
    await queryInterface.addColumn('category_masters', 'parent_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
    // Truncate the category_masters table
    await queryInterface.sequelize.query('TRUNCATE TABLE category_masters');

    // Insert main categories: Ring and Bracelet with parent_id = 0
    await queryInterface.bulkInsert('category_masters', [
      {
        category_name: 'Ring',
        category_code: 'RG',
        parent_id: 0,
        deleted_at: null
      },
      {
        category_name: 'Bracelet',
        category_code: 'BR',
        parent_id: 0,
        deleted_at: null
      },
      {
        category_name: 'Necklace and Pendant',
        category_code: 'NL',
        parent_id: 0,
        deleted_at: null
      },
      {
        category_name: 'Earring',
        category_code: 'ER',
        parent_id: 0,
        deleted_at: null
      },
    ]);

    // Get the Ring category ID
    const [ringCategory] = await queryInterface.sequelize.query(
      "SELECT id FROM category_masters WHERE category_name = 'Ring' AND parent_id = 0 LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (ringCategory && ringCategory.id) {
      const ringId = ringCategory.id;

      // Insert subcategories with parent_id = Ring's id
      await queryInterface.bulkInsert('category_masters', [
        {
          category_name: 'Alliance',
          category_code: 'AL',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: 'Solitaire',
          category_code: 'SL',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: '3 Stone',
          category_code: '3S',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: 'Fancy',
          category_code: 'FC',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: 'Fancy Stone',
          category_code: 'FS',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: 'Halo',
          category_code: 'HL',
          parent_id: ringId,
          deleted_at: null
        },
        {
          category_name: "Men's Ring",
          category_code: 'MR',
          parent_id: ringId,
          deleted_at: null
        }
      ]);
    }
    // Truncate the style_masters table
    await queryInterface.sequelize.query('TRUNCATE TABLE style_masters');

    // Get all category IDs
    const categories = await queryInterface.sequelize.query(
      "SELECT id, category_name FROM category_masters WHERE parent_id != 0",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat.id;
    });

    // Prepare styles array with category_master_id
    const styles = [];

    // Alliance styles
    if (categoryMap['Alliance']) {
      styles.push(
        { style_name: 'Lumo', style_code: 'LM', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Kastahelmi', style_code: 'KH', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Emerald', style_code: 'EM', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Classic', style_code: 'CL', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Closed Setting Migrain', style_code: 'CSM', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Wave', style_code: 'WV', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Kuura Slim', style_code: 'KS', category_master_id: categoryMap['Alliance'] },
        { style_name: 'Kielo', style_code: 'KL', category_master_id: categoryMap['Alliance'] }
      );
    }

    // Solitaire styles
    if (categoryMap['Solitaire']) {
      styles.push(
        { style_name: 'Classic', style_code: 'CL', category_master_id: categoryMap['Solitaire'] },
        { style_name: 'Classic Trim', style_code: 'CT', category_master_id: categoryMap['Solitaire'] },
        { style_name: 'Forest', style_code: 'FR', category_master_id: categoryMap['Solitaire'] }
      );
    }

    // 3 Stone styles
    if (categoryMap['3 Stone']) {
      styles.push(
        { style_name: 'Three Crowns', style_code: 'TC', category_master_id: categoryMap['3 Stone'] },
        { style_name: 'Trio', style_code: 'TR', category_master_id: categoryMap['3 Stone'] },
        { style_name: 'Kolme Garden', style_code: 'KG', category_master_id: categoryMap['3 Stone'] }
      );
    }

    // Fancy styles
    if (categoryMap['Fancy']) {
      styles.push(
        { style_name: 'Aalto', style_code: 'AL', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Olive', style_code: 'OL', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Vare', style_code: 'VR', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Silk', style_code: 'SK', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Verso', style_code: 'VS', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Puro', style_code: 'PR', category_master_id: categoryMap['Fancy'] },
        { style_name: 'Tiara', style_code: 'TA', category_master_id: categoryMap['Fancy'] }
      );
    }

    // Fancy Stone styles
    if (categoryMap['Fancy Stone']) {
      styles.push(
        { style_name: 'Crown', style_code: 'CR', category_master_id: categoryMap['Fancy Stone'] },
        { style_name: 'Garden Crown', style_code: 'GC', category_master_id: categoryMap['Fancy Stone'] },
        { style_name: 'Forest Flower', style_code: 'FF', category_master_id: categoryMap['Fancy Stone'] },
        { style_name: 'Edina', style_code: 'ED', category_master_id: categoryMap['Fancy Stone'] }
      );
    }

    // Halo styles
    if (categoryMap['Halo']) {
      styles.push(
        { style_name: 'Kukka', style_code: 'KK', category_master_id: categoryMap['Halo'] },
        { style_name: 'Royale', style_code: 'RY', category_master_id: categoryMap['Halo'] },
        { style_name: 'Flower Glow', style_code: 'FG', category_master_id: categoryMap['Halo'] }
      );
    }

    // Men's Ring styles
    if (categoryMap["Men's Ring"]) {
      styles.push(
        { style_name: 'Admiral', style_code: 'AD', category_master_id: categoryMap["Men's Ring"] },
        { style_name: 'Paladin', style_code: 'PL', category_master_id: categoryMap["Men's Ring"] },
        { style_name: 'Razor', style_code: 'RZ', category_master_id: categoryMap["Men's Ring"] },
        { style_name: 'Mariner', style_code: 'MR', category_master_id: categoryMap["Men's Ring"] }
      );
    }

    // Insert all styles
    if (styles.length > 0) {
      await queryInterface.bulkInsert('style_masters', styles);
    }

    await queryInterface.bulkInsert('karats', [
      {
        metal_type: 'Platinum',
        karat_value: '950',
        karat: '950PT'
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('style_masters', 'category_master_id');
    await queryInterface.removeColumn('category_masters', 'parent_id');
  }
};
