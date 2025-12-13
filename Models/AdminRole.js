const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const AdminRole = sequelize.define(
    "admin_roles",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        role_name: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        created_at: {
            type: "TIMESTAMP",
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
        },
        updated_at: {
            type: "TIMESTAMP",
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            allowNull: false,
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

module.exports = AdminRole;