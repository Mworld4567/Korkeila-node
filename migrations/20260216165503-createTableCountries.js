'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('countries', {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
          country_name: { type: Sequelize.STRING(255), allowNull: false },
          iso_code: { type: Sequelize.STRING(50), allowNull: false },
          phone_code: { type: Sequelize.STRING(50), allowNull: true },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('countries');
    }
};

