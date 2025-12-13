const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const AdminLog = sequelize.define(
    "admin_logs",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        admin_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
        },
        action_module: {
            type: Sequelize.STRING,
            allowNull: true
        },
        action_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
        },
        remark: {
            type: Sequelize.STRING(1000),
            allowNull: true
        },
        ip_address: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },

    }, { timestamps: false }
);

module.exports = AdminLog;