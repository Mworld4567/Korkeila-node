'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('site_settings', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            site_logo_name: { type: Sequelize.STRING(255), allowNull: true },
            site_logo_url: { type: Sequelize.STRING(255), allowNull: true },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('site_settings');
    }
};

