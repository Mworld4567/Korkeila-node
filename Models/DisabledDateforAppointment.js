const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const DisabledTimeSlotsForAppointment = require("./DisabledTimeSlotsForAppointment");

const DisabledDateforAppointment = sequelize.define(
    "disabled_date_for_appointments",
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

        date: { 
            type: Sequelize.DATEONLY, 
            allowNull: false 
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

DisabledDateforAppointment.hasMany(DisabledTimeSlotsForAppointment, { foreignKey: 'disabled_date_for_appointment_id', as: 'disabled_time_slots' });

module.exports = DisabledDateforAppointment;