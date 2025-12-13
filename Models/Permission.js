const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Permission = sequelize.define(
    "permissions",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        type: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        rights: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    }
);

module.exports = Permission;