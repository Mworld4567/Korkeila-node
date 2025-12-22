'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'product_name', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    // Truncate metals table first before adding metal_code column
    await queryInterface.sequelize.query('TRUNCATE TABLE metals');
      await queryInterface.addColumn('metals', 'metal_code', {
        type: Sequelize.STRING(255),
        allowNull: false,
      });
    await queryInterface.bulkInsert('metals', [
      { metal_name: 'Yellow Gold', metal_code: 'YG' },
      { metal_name: 'Rose Gold', metal_code: 'RG' },
      { metal_name: 'White Gold', metal_code: 'WG' },
      { metal_name: 'Platinum', metal_code: 'PT' },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'product_name');
    // await queryInterface.removeColumn('metals', 'metal_code');
  }
};
