const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Appointment = sequelize.define(
    "appointments",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        first_name: { type: Sequelize.STRING(255), allowNull: true },
        last_name: { type: Sequelize.STRING(255), allowNull: true },
        country: { type: Sequelize.STRING(50), allowNull: true },
        email: { type: Sequelize.STRING(50), allowNull: true },
        phone_number: { type: Sequelize.STRING(50), allowNull: true },
        date: { type: Sequelize.DATEONLY, allowNull: true },
        time_slot: { type: Sequelize.STRING(50), allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = Appointment;