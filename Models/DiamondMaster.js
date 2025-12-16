const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DiamondMaster = sequelize.define(
    "diamond_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        carat: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
        size_from: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
        size_to: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = DiamondMaster;