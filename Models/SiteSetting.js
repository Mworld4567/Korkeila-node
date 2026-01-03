const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const SiteSetting = sequelize.define(
    "site_settings",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        site_logo_name: { type: Sequelize.STRING(255), allowNull: true },
        site_logo_url: { type: Sequelize.STRING(255), allowNull: true },

    },
    {
        timestamps: false,
    }
);

module.exports = SiteSetting;