const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const AdminRole = require("./AdminRole");

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
        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    }
);

Admin.belongsTo(AdminRole, { foreignKey: 'role_id', as: 'admin_role' });

module.exports = Admin;