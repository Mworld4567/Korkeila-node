'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // await queryInterface.createTable('product_translations', {
        //     id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        //     product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        //     language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        //     product_name: { type: Sequelize.STRING(255), allowNull: false },
        // });
        // await queryInterface.changeColumn('products', 'image', { type: Sequelize.STRING(255), allowNull: true });
        await queryInterface.removeColumn('products', 'product_name');
        // await queryInterface.addColumn('designs', 'is_filter_available', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 });
        // await queryInterface.addColumn('designs_diamond_details', 'is_default', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('product_translations');
        await queryInterface.removeColumn('designs', 'is_filter_available');
        await queryInterface.removeColumn('designs_diamond_details', 'is_default');
    }
};

