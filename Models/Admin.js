const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Admin = sequelize.define(
    "admins",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        username: {
            type: Sequelize.STRING(50),
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        password: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        is_super_admin: {
            type: Sequelize.TINYINT(4),
            allowNull: true,
            defaultValue: 0,
        },
        role_id: {
            type: Sequelize.TINYINT(4),
            allowNull: true,
        },
        auth_token: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        refresh_token: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        status: {
            type: Sequelize.TINYINT(4),
            allowNull: true,
            defaultValue: 1,
            comment: "1 - Active and 0 - Deactive",
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

module.exports = Admin;