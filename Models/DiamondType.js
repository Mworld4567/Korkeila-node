const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DiamondType = sequelize.define(
    "diamond_types",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        type_name: { type: Sequelize.STRING(255), allowNull: false },
        type_code: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = DiamondType;