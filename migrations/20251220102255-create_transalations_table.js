'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('category_translations', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      category_name: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('category_translations', [
      { category_id: 1, language_id: 1, category_name: 'Ring' },
      { category_id: 1, language_id: 2, category_name: 'Sormukset' },
      { category_id: 2, language_id: 1, category_name: 'Bracelets' },
      { category_id: 2, language_id: 2, category_name: 'Rannekorut' },
      { category_id: 3, language_id: 1, category_name: 'Necklaces and Pendants' },
      { category_id: 3, language_id: 2, category_name: 'Kaulakorut ja Riipukse' },
      { category_id: 4, language_id: 1, category_name: 'Earrings' },
      { category_id: 4, language_id: 2, category_name: 'Korvakorut' },
    ]);
    await queryInterface.createTable('metal_translations', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      metal_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      metal_name: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('metal_translations', [
      { metal_id: 1, language_id: 1, metal_name: 'Yellow Gold' },
      { metal_id: 1, language_id: 2, metal_name: 'Ruusukulta' },
      { metal_id: 2, language_id: 1, metal_name: 'Rose Gold' },
      { metal_id: 2, language_id: 2, metal_name: 'Ruusukulta' },
      { metal_id: 3, language_id: 1, metal_name: 'White Gold' },
      { metal_id: 3, language_id: 2, metal_name: 'Keltakulta' },
    ]);
    await queryInterface.createTable('diamond_type_translations', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      diamond_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      diamond_type_name: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('diamond_type_translations', [
      { diamond_type_id: 1, language_id: 1, diamond_type_name: 'Natural brilliat' },
      { diamond_type_id: 1, language_id: 2, diamond_type_name: 'Luonnollinen brilliat' },
      { diamond_type_id: 2, language_id: 1, diamond_type_name: 'Lab Brilliant' },
      { diamond_type_id: 2, language_id: 2, diamond_type_name: 'Laboratori Brilliant' },
      { diamond_type_id: 3, language_id: 1, diamond_type_name: 'Stone' },
      { diamond_type_id: 3, language_id: 2, diamond_type_name: 'Kivi' },
    ]);
    await queryInterface.createTable('ui_strings', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      ui_string_key: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('ui_strings', [
      { ui_string_key: 'header_share' },
      { ui_string_key: 'header_appointment' },
      { ui_string_key: 'header_contact' },
      { ui_string_key: 'menu_home' },
      { ui_string_key: 'menu_about' },
      { ui_string_key: 'menu_product' },
      { ui_string_key: 'submenu_product_ring' },
      { ui_string_key: 'submenu_product_finejew' },
      { ui_string_key: 'submenu_diamondfig' },
      { ui_string_key: 'menu_sustain' },
      { ui_string_key: 'menu_guide' },
      { ui_string_key: 'menu_shippingreturn' },
      { ui_string_key: 'menu_contact' },
      { ui_string_key: 'banner_link1' },
      { ui_string_key: 'heading_category' },
      { ui_string_key: 'footer_copyright' },
      { ui_string_key: 'footer_head1' },
      { ui_string_key: 'footer_head2' },
      { ui_string_key: 'banner3_head3' },
      { ui_string_key: 'banner4_head4' },
      { ui_string_key: 'banner1_para1' },
      { ui_string_key: 'banner2_para2' },
      { ui_string_key: 'banner3_para3' },
      { ui_string_key: 'banner4_para4' },
      { ui_string_key: 'select' },
      { ui_string_key: '30_day' },
      { ui_string_key: 'free_express' },
      { ui_string_key: 'btn_cart' },
    ]);
    await queryInterface.createTable('ui_string_translations', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
      ui_string_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      ui_string_key: { type: Sequelize.STRING(255), allowNull: false },
    });
    await queryInterface.bulkInsert('ui_string_translations', [
      { ui_string_id: 1, language_id: 1, ui_string_key: 'Share' },
      { ui_string_id: 1, language_id: 2, ui_string_key: 'Jakaa' },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('category_transalations');
    await queryInterface.dropTable('metal_translations');
  }
};
