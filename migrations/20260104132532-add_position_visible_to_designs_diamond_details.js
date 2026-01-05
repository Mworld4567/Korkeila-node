'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('designs_diamond_details', 'position_visible', {
            type: Sequelize.TINYINT(4),
            allowNull: false,
            defaultValue: 1
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('designs_diamond_details', 'position_visible');
    }
};

