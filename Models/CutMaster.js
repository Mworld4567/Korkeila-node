const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const CutMaster = sequelize.define(
    "cut_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        cut_name: { type: Sequelize.STRING(255), allowNull: false },
        cut_code: { type: Sequelize.STRING(255), allowNull: false },
        cut_image: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = CutMaster;