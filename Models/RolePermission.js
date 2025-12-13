const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Permission = require("./Permission");

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
        deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    }
);

RolePermission.belongsTo(Permission, {
	foreignKey: "permission_id",
	as: "userRolePermission",
});

module.exports = RolePermission;