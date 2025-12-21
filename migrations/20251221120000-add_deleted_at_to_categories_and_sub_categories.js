'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deleted_at column to categories table
    await queryInterface.addColumn('categories', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add deleted_at column to sub_categories table
    await queryInterface.addColumn('sub_categories', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove deleted_at column from sub_categories table
    await queryInterface.removeColumn('sub_categories', 'deleted_at');

    // Remove deleted_at column from categories table
    await queryInterface.removeColumn('categories', 'deleted_at');
  }
};
