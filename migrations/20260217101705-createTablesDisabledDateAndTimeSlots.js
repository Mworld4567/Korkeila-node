'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('disabled_date_for_appointments', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            admin_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            date: { type: Sequelize.DATEONLY, allowNull: false },
            flag: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0, comment: '0 - Disabled and 1 - Booked' },
            created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
            updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false, },
            deleted_at: { type: Sequelize.DATE, allowNull: true },
        });

        await queryInterface.createTable('disabled_time_slots_for_appointments', {
            id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
            admin_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            disabled_date_for_appointment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
            time_slot: { type: Sequelize.STRING(255), allowNull: false },
            flag: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0, comment: '0 - Disabled and 1 - Booked' },
            created_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), allowNull: false },
            updated_at: { type: "TIMESTAMP", defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), allowNull: false, },
            deleted_at: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('disabled_time_slots_for_appointments');
        await queryInterface.dropTable('disabled_date_for_appointments');
    }
};
