const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const UiString = sequelize.define(
    "ui_strings",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        ui_string_key: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = UiString;
