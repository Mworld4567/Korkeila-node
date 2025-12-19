const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const StyleMaster = sequelize.define(
    "style_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        style_name: { type: Sequelize.STRING(255), allowNull: false },
        style_code: { type: Sequelize.STRING(255), allowNull: false },
        category_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = StyleMaster;