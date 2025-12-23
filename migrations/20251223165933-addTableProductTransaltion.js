'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('product_translations', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            product_name: { type: Sequelize.STRING(255), allowNull: false },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('product_translations');
    }
};

