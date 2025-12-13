const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const RolePermission = sequelize.define(
    "role_permissions",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        role_id: {
            type: Sequelize.INTEGER(11).UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
        permission_id: {
            type: Sequelize.INTEGER(11).UNSIGNED,
            allowNull: false,
            primaryKey: true,
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

module.exports = RolePermission;