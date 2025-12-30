'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('designs', 'price_flag', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn('designs_diamond_details', 'is_center', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('designs', 'price_flag');
    await queryInterface.removeColumn('designs_diamond_details', 'is_center');
  }
};
