'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add order_by column to sub_categories table
    await queryInterface.addColumn('sub_categories', 'order_by', {
      type: Sequelize.INTEGER(11),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove order_by column from sub_categories table
    await queryInterface.removeColumn('sub_categories', 'order_by');
  }
};
