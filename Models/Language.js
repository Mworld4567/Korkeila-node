const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Language = sequelize.define(
    "languages",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        language_name: { type: Sequelize.STRING(255), allowNull: false },
        language_code: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = Language;