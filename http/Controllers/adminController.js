const Admin = require("../../Models/Admin");
const AdminRole = require("../../Models/AdminRole");
const bcrypt = require("bcryptjs");
const logError = require("../../logger/log");
const logMiddleware = require("../middlewares/logMiddleware");
const helperFunc = require("../../helpers/helperFunc");
const { body, validationResult } = require("express-validator");
const globalVariable = require("../../config/globalVariable");
const dateFunc = require("../../helpers/dateFunc");
require("dotenv").config();

const adminController = () => {
    return {
        create: async (req, res) => {
            const transaction = req.transaction || null;
            try {

                if (!req.body.email || req.body.email === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your email",
                    });
                }

                if (!req.body.password || req.body.password === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your password",
                    });
                }

                if (!req.body.username || req.body.username === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your username",
                    });
                }

                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
                if (!passwordRegex.test(req.body.password)) {
                    return res.status(409).json({
                        success: false,
                        message: "Password must have uppercase, lowercase, special character, number and minimum 8 characters",
                    });
                }

                const existingAdmin = await Admin.findOne({ where: { email: req.body.email }, transaction });
                if (existingAdmin) {
                    return res.status(409).json({
                        success: false,
                        message: "This email address is already registered",
                    });
                }

                if (req.body.mobile_number && req.body.mobile_number !== "") {
                    const mobileRegex = /^[0-9]{10}$/;
                    if (!mobileRegex.test(req.body.mobile_number)) {
                        return res.status(409).json({
                            success: false,
                            message: "Please enter a valid 10-digit mobile number",
                        });
                    }
                }


                const salt = await bcrypt.genSalt(10);
                const securedPassword = await bcrypt.hash(req.body.password, salt);

                const data = {
                    email: req.body.email.trim(),
                    password: securedPassword,
                    status: 1,
                };

                if (req.body.username && req.body.username !== "") {
                    data.username = req.body.username.trim();
                }

                if (req.body.mobile_number && req.body.mobile_number !== "") {
                    data.mobile_number = req.body.mobile_number.trim();
                }

                const mydata = await Admin.create(data, { transaction });

                let getClientIp = helperFunc.getClientIp(req);

                await logMiddleware(
                    globalVariable.globalAdminActions.UserCreate,
                    req.user.id,
                    "User created, Email : " + data.email,
                    getClientIp,
                    "User Create",
                    transaction,
                );

                return res.status(200).json({
                    success: true,
                    message: "User created successfully",
                    data: {
                        id: mydata.id,
                        email: mydata.email,
                        username: mydata.username || null,
                        mobile_number: mydata.mobile_number || null,
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

                const mydata = await Admin.findAll({
                    include: [
                        {
                            model: AdminRole,
                            as: "admin_role",
                            required: false,
                        },
                    ],
                });
                if (!mydata.length) {
                    return res.status(409).json({
                        success: true,
                        message: "No user found",
                    });
                }

                const data = mydata.map((x) => {
                    return {
                        id: x.dataValues.id,
                        username: x.dataValues.username,
                        email: x.dataValues.email,
                        role_name: x.dataValues.admin_role ? x.dataValues.admin_role.dataValues.role_name : null,
                        status: x.dataValues.status,
                    };
                });

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.UserRead,
                    req.user.id,
                    "Users fetched, Email : " + req.body.email,
                    getClientIp,
                    "User Read",
                );

                return res.status(200).json({
                    success: true,
                    message: "Users fetched successfully",
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

                let mydata = await Admin.findOne({
                    where: {
                        id: req.params.id
                    },
                });

                if (!mydata) {
                    return res.status(409).json({ 
                        success: true,
                        message: "No user details found",
                    });
                }

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.UserReadOne,
                    req.user.id,
                    "User details fetched, Email : " + mydata.email,
                    getClientIp,
                    "User Read One",
                );

                return res.status(200).json({
                    success: true,
                    message: "User details fetched successfully",
                    data: mydata,
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

                const userData = await Admin.findByPk(req.params.id, { transaction });
                if (!userData) {
                    return res.status(409).json({
                        success: true,
                        message: "No user details found",
                    });
                }

                const data = {
                    email: req.body.email.trim(),
                    password: req.body.password.trim(),
                    status: req.body.status,
                };

                if (req.body.username && req.body.username !== "") {
                    data.username = req.body.username.trim();
                }
                
                if (req.body.mobile_number && req.body.mobile_number !== "") {
                    data.mobile_number = req.body.mobile_number.trim();
                }

                if (!req.body.password || req.body.password === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your password",
                    });
                }

                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
                if (!passwordRegex.test(req.body.password)) {
                    return res.status(409).json({
                        success: false,
                        message: "Password must have uppercase, lowercase, special character, number and minimum 8 characters",
                    });
                }

                const salt = await bcrypt.genSalt(10);
                const securedPassword = await bcrypt.hash(req.body.password, salt);

                await Admin.update(
                    { password: securedPassword, ...data },
                    { where: { id: req.params.id }, transaction }
                );

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.UserUpdate,
                    req.user.id,
                    "User password updated, Email : " + req.body.email,
                    getClientIp,
                    "User Update",
                    transaction,
                );

                return res.status(200).json({
                    success: true,
                    message: "Password changed successfully",
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
              
                const parametercheck = await Admin.findOne({
                    where: { deleted_at: null, id: req.params.id },
                    transaction,
                });
                if (!parametercheck) {
                    return res.status(409).json({
                        success: true,
                        message: "No user found",
                    });
                }

                const dateTime = dateFunc();
                const id = req.params.id;

                await Admin.update(
                    { deleted_at: dateTime },
                    { where: { id: id }, transaction }
                );

                let getClientIp = helperFunc.getClientIp(req);
                await logMiddleware(
                    globalVariable.globalAdminActions.UserDelete,
                    req.user.id,
                    "User deleted, Email : " + parametercheck.email,
                    getClientIp,
                    "User Delete",
                    transaction,
                );
                return res.status(200).json({
                    success: true,
                    message: "User deleted successfully",
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
module.exports = adminController;
