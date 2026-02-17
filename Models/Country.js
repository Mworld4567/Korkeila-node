const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Country = sequelize.define(
    "countries",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        country_name: { type: Sequelize.STRING(255), allowNull: false },
        iso_code: { type: Sequelize.STRING(50), allowNull: false },
        phone_code: { type: Sequelize.STRING(50), allowNull: true }
    },
    {
        timestamps: false,
    }
);

module.exports = Country;