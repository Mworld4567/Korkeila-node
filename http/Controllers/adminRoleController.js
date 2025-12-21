const AdminRole = require("../../Models/AdminRole");
const RolePermission = require("../../Models/RolePermission");
const logError = require("../../logger/log");
const logMiddleware = require("../middlewares/logMiddleware");
const helperFunc = require("../../helpers/helperFunc");
const globalVariable = require("../../config/globalVariable");
const dateFunc = require("../../helpers/dateFunc");
const { Op } = require("sequelize");
require("dotenv").config();

const adminRoleController = () => {
    return {
        create: async (req, res) => {
            const transaction = req.transaction || null;
            try {

                if (!req.body.role_name || req.body.role_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter role name",
                    });
                }

                const roleName = req.body.role_name.trim();
                const roleNameRegex = /^[A-Za-z0-9 _]*[A-Za-z]+[A-Za-z0-9 _]*$/;
                if (!roleNameRegex.test(roleName)) {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter a valid role name",
                    });
                }

                const existingRole = await AdminRole.findOne({
                    where: {
                        role_name: roleName,
                        deleted_at: null
                    },
                    transaction
                });
                if (existingRole) {
                    return res.status(409).json({
                        success: false,
                        message: "This role name is already registered",
                    });
                }

                if (!req.body.permission || !Array.isArray(req.body.permission) || req.body.permission.length === 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter valid permissions",
                    });
                }

                const data = {
                    role_name: roleName,
                };

                const mydata = await AdminRole.create(data, { transaction });

                // Create role permissions
                const rolePermissions = req.body.permission.map(permissionId => ({
                    role_id: mydata.id,
                    permission_id: permissionId,
                }));

                await RolePermission.bulkCreate(rolePermissions, { transaction });

                let getClientIp = helperFunc.getClientIp(req);

                await logMiddleware(
                    globalVariable.globalAdminActions.RoleCreate,
                    req.user.id,
                    "Role created, Role Name : " + data.role_name,
                    getClientIp,
                    "Role Create",
                    transaction,
                );

                return res.status(200).json({
                    success: true,
                    message: "Role created successfully",
                    data: {
                        id: mydata.id,
                        role_name: mydata.role_name,
                        permissions: req.body.permission,
                    },
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        read: async (req, res) => {
            try {

                const mydata = await AdminRole.findAll({
                    where: {
                        deleted_at: null
                    },
                });

                if (!mydata.length) {
                    return res.status(409).json({
                        success: true,
                        message: "No role found",
                    });
                }

                const data = mydata.map((x) => {
                    return {
                        id: x.dataValues.id,
                        role_name: x.dataValues.role_name,
                    };
                });

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.RoleRead,
                    req.user.id,
                    "Roles fetched",
                    getClientIp,
                    "Role Read",
                );

                return res.status(200).json({
                    success: true,
                    message: "Roles fetched successfully",
                    data: data,
                });
            } catch (error) {
                console.log(error)
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        readOne: async (req, res) => {
            try {

                let mydata = await AdminRole.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    },
                    include: [
                        {
                            model: RolePermission,
                            as: "role_permission",
                            required: false,
                        },
                    ],
                });

                if (!mydata) {
                    return res.status(409).json({ message: "No data", success: true });
                }
                let role_permission = mydata.dataValues.role_permission.map(
                    (x) => {
                        return x.dataValues;
                    }
                );
                let adminrole = mydata.dataValues;
                let data = {};
                data["id"] = adminrole.id;
                data["role_name"] = adminrole.role_name;
                data["permissions"] = role_permission;


                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.RoleReadOne,
                    req.user.id,
                    "Role details fetched, Role Name : " + data.role_name,
                    getClientIp,
                    "Role Read One",
                );

                return res.status(200).json({
                    success: true,
                    message: "Role details fetched successfully",
                    data: {
                        id: mydata.id,
                        role_name: mydata.role_name,
                        permissions: data.permissions,
                    },
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        update: async (req, res) => {
            const transaction = req.transaction || null;
            try {

                const roleData = await AdminRole.findByPk(req.params.id, { transaction });
                if (!roleData || roleData.deleted_at !== null) {
                    return res.status(409).json({
                        success: true,
                        message: "No role details found",
                    });
                }

                if (!req.body.role_name || req.body.role_name === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter role name",
                    });
                }

                const roleName = req.body.role_name.trim();
                const roleNameRegex = /^[A-Za-z0-9 _]*[A-Za-z]+[A-Za-z0-9 _]*$/;
                if (!roleNameRegex.test(roleName)) {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter a valid role name",
                    });
                }


                const existingRole = await AdminRole.findOne({
                    where: {
                        role_name: roleName,
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    },
                    transaction
                });
                if (existingRole) {
                    return res.status(409).json({
                        success: false,
                        message: "This role name is already registered",
                    });
                }

                if (!req.body.permission || !Array.isArray(req.body.permission) || req.body.permission.length === 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter valid permissions",
                    });
                }


                const data = {
                    role_name: roleName,
                };

                await AdminRole.update(
                    data,
                    { where: { id: req.params.id }, transaction }
                );

                const dateTime = dateFunc();
                await RolePermission.update(
                    { deleted_at: dateTime },
                    { where: { role_id: req.params.id }, transaction }
                );

                const rolePermissions = req.body.permission.map(permissionId => ({
                    role_id: parseInt(req.params.id),
                    permission_id: permissionId,
                }));

                await RolePermission.bulkCreate(rolePermissions, { transaction });

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.RoleUpdate,
                    req.user.id,
                    "Role updated, Role Name : " + data.role_name,
                    getClientIp,
                    "Role Update",
                    transaction,
                );

                return res.status(200).json({
                    success: true,
                    message: "Role updated successfully",
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        delete: async (req, res) => {
            const transaction = req.transaction || null;
            try {

                const parametercheck = await AdminRole.findOne({
                    where: { deleted_at: null, id: req.params.id },
                    transaction,
                });
                if (!parametercheck) {
                    return res.status(409).json({
                        success: true,
                        message: "No role found",
                    });
                }

                const dateTime = dateFunc();
                const id = req.params.id;

                await AdminRole.update(
                    { deleted_at: dateTime },
                    { where: { id: id }, transaction }
                );

                await RolePermission.update(
                    { deleted_at: dateTime },
                    { where: { role_id: id }, transaction }
                );

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.RoleDelete,
                    req.user.id,
                    "Role deleted, Role Name : " + parametercheck.role_name,
                    getClientIp,
                    "Role Delete",
                    transaction,
                );
                return res.status(200).json({
                    success: true,
                    message: "Role deleted successfully",
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
    };
};
module.exports = adminRoleController;
