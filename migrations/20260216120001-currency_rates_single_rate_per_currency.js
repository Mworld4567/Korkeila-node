'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('currency_rates').catch(() => null);
        if (!tableInfo) return;
        if (tableInfo.currency_code != null) return;

        const [rows] = await queryInterface.sequelize.query(
            "SELECT to_currency AS currency_code, rate, created_at, updated_at FROM currency_rates WHERE from_currency = 'EUR'"
        );
        await queryInterface.dropTable('currency_rates');
        await queryInterface.createTable('currency_rates', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            currency_code: { type: Sequelize.STRING(10), allowNull: false },
            rate: { type: Sequelize.DECIMAL(18, 6), allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: true },
            updated_at: { type: Sequelize.DATE, allowNull: true },
        });
        await queryInterface.addIndex('currency_rates', ['currency_code'], { name: 'idx_currency_rates_code', unique: true });
        if (rows && rows.length > 0) {
            await queryInterface.bulkInsert('currency_rates', rows);
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('currency_rates').catch(() => null);
        if (!tableInfo || tableInfo.currency_code == null) return;

        await queryInterface.dropTable('currency_rates');
        await queryInterface.createTable('currency_rates', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            from_currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'EUR' },
            to_currency: { type: Sequelize.STRING(10), allowNull: false },
            rate: { type: Sequelize.DECIMAL(18, 6), allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: true },
            updated_at: { type: Sequelize.DATE, allowNull: true },
        });
        await queryInterface.addIndex('currency_rates', ['from_currency', 'to_currency'], { unique: true });
    }
};
