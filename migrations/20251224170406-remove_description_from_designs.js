'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('designs', 'description');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('designs', 'description', {
            type: Sequelize.TEXT,
            allowNull: true
        });
    }
};

