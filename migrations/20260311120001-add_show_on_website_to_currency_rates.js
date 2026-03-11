'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('currency_rates').catch(() => null);
        if (!tableInfo) return;
        if (tableInfo.show_on_website) return;

        await queryInterface.addColumn('currency_rates', 'show_on_website', {
            type: Sequelize.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
            comment: '1 = show on website, 0 = hide',
        });
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('currency_rates').catch(() => null);
        if (!tableInfo || !tableInfo.show_on_website) return;
        await queryInterface.removeColumn('currency_rates', 'show_on_website');
    },
};

