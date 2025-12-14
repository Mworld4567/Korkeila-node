const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const RolePermission = require("./RolePermission");

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
        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    }
);

AdminRole.hasMany(RolePermission, {foreignKey : 'role_id', as : 'role_permission'});


module.exports = AdminRole;