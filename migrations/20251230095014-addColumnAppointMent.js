'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('appointments', {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
          first_name: { type: Sequelize.STRING(255), allowNull: true },
          last_name: { type: Sequelize.STRING(255), allowNull: true },
          country: { type: Sequelize.STRING(50), allowNull: true },
          email: { type: Sequelize.STRING(50), allowNull: true },
          phone_number: { type: Sequelize.STRING(50), allowNull: true },
          date: { type: Sequelize.DATEONLY, allowNull: true },
          time_slot: { type: Sequelize.STRING(50), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
          updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false },
          deleted_at: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('appointments');
    }
};

