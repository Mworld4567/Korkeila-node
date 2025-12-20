const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DiamondClarity = sequelize.define(
    "diamond_clarities",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        clarity: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = DiamondClarity;