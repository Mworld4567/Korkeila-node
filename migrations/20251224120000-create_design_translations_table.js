'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('design_translations', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
        });
        await queryInterface.addColumn('designs', 'is_filter_available', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 });
        await queryInterface.addColumn('designs_diamond_details', 'is_default', { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('design_translations');
    }
};

