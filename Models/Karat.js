const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Karat = sequelize.define(
    "karats",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        metal_type: { type: Sequelize.ENUM('gold', 'silver', 'platinum', 'palladium'), allowNull: false },
        karat_value: { type: Sequelize.STRING(255), allowNull: true },
        karat: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);


module.exports = Karat;