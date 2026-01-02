const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Metal = sequelize.define(
    "metals",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        metal_name: { type: Sequelize.STRING(255), allowNull: true },
        metal_code: { type: Sequelize.STRING(255), allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = Metal;
