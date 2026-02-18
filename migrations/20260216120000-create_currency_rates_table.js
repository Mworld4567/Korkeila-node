'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('currency_rates', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                allowNull: false,
                primaryKey: true,
            },
            currency_code: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            rate: {
                type: Sequelize.DECIMAL(18, 6),
                allowNull: false,
            },
            created_at: { type: Sequelize.DATE, allowNull: true },
            updated_at: { type: Sequelize.DATE, allowNull: true },
        });
        await queryInterface.addIndex('currency_rates', ['currency_code'], {
            name: 'idx_currency_rates_code',
            unique: true,
        });
        await queryInterface.bulkInsert('currency_rates', [
            {
                currency_code: 'SGD',
                rate: 1.45,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('currency_rates');
    }
};
