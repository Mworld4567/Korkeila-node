const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Karat = sequelize.define(
    "karats",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        karat: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = Karat;