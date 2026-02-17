const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DisabledTimeSlotsForAppointment = sequelize.define(
    "disabled_time_slots_for_appointments",
    {
        id: { 
            type: Sequelize.BIGINT.UNSIGNED, 
            autoIncrement: true, 
            allowNull: false, 
            primaryKey: true 
        },

        admin_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
        },

        disabled_date_for_appointment_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
        },

        time_slot: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },

        flag: { 
            type: Sequelize.TINYINT(4), 
            allowNull: false,
            defaultValue: 0,
            comment: "0 - Disabled and 1 - Booked",
        },

        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    }
);

module.exports = DisabledTimeSlotsForAppointment;