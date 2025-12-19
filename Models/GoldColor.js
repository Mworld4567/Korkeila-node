const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const GoldColor = sequelize.define(
    "gold_colors",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        color: { type: Sequelize.STRING(255), allowNull: false },
        colour_code: { type: Sequelize.STRING(255), allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = GoldColor;
