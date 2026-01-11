'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('designs', 'price', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 });
    await queryInterface.addColumn('designs', 'pricing_message', { type: Sequelize.STRING(255), allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('designs', 'price');
    await queryInterface.removeColumn('designs', 'pricing_message');
  }
};
