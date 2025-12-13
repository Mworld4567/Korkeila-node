require('dotenv').config()
const Admin = require("../../Models/Admin");
const logError = require("../../logger/log");
const { validationResult } = require('express-validator')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const WHITELIST_IP = process.env.WHITELIST_IP
const IS_WHITELIST_IP_BY_PASS = process.env.IS_WHITELIST_IP_BY_PASS
const logMiddleware = require("../middlewares/logMiddleware");
const globalVariable = require("../../config/globalVariable");
const helperFunc = require("../../helpers/helperFunc");

module.exports = {
    userLogin: async (req, res) => {
        try {

            if (!req.body.email || req.body.email === "") {
                return res.status(401).json({
                    success: false,
                    message: "Please enter your email",
                });
            }

            if (!req.body.password || req.body.password === "") {
                return res.status(401).json({
                    success: false,
                    message: "Please enter your password",
                });
            }

            let WHITELIST_IPS = WHITELIST_IP.split(",")
            let remoteAddress = helperFunc.getClientIp(req)

            if (WHITELIST_IPS.includes(remoteAddress) || IS_WHITELIST_IP_BY_PASS == "true") {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    const error = errors.array().map((x) => {
                        return {
                            field: x.param,
                            message: x.msg,
                        };
                    });
                    return res.status(401).json({
                        error,
                        success: false
                    });
                }
                const { email, password } = req.body;
                let user = await Admin.findOne({ where: { email } });
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: "This email address is not registered.",
                    });
                }

                const comparePassword = await bcrypt.compare(password, user.dataValues.password);
                if (!comparePassword) {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter valid password",
                    });
                }


                if (user.dataValues.status === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "You are deactivated, Please contact your administrator.",
                    });
                }

                const data = {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                    },
                };

                let getClientIp = helperFunc.getClientIp(req)

                const transaction = req.transaction || null;

                await logMiddleware(
                    globalVariable.globalAdminActions.Login,
                    user.dataValues.id,
                    "User Logged in, email: " + user.dataValues.email,
                    getClientIp,
                    "Login",
                    transaction
                );

                const authToken = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '24h' });
                const refreshToken = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '365d' });

                await Admin.update(
                    { auth_token: authToken, refresh_token: refreshToken }, 
                    { where: { email }, transaction }
                );


                return res.cookie("authorization", `Bearer ${authToken}`).status(200).json({
                    success: true,
                    message: "Logged in successfully",
                    authToken,
                    refreshToken,
                    id: user.id,
                    email: user.email,
                    username: user.username,
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Your IP is restricted to login."
                });
            }
        } catch (error) {
            console.log(error);
            logError(error, req);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    },
    getAccessToken: async (req, res) => {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token || refresh_token === "") {
                return res.status(401).json({
                    success: false,
                    message: "Please enter your refresh token"
                });
            }

            let user = await Admin.findOne({ where: { refresh_token, deleted_at: null }, attributes: ['id'], raw: true });
            if (!user) return res.status(401).json({ 
                success: false,
                message: "Failed to get token"
            });

            const data = {
                user: {
                    id: user.id,
                },
            };

            jwt.verify(refresh_token, process.env.JWT_SECRET);
            const authToken = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '24h' });

            const transaction = req.transaction || null;
            await Admin.update(
                { auth_token: authToken }, 
                { where: { refresh_token }, transaction }
            );

            return res.cookie("authorization", `Bearer ${authToken}`).status(401).json({
                success: true,
                authToken
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
    userLogout: async (req, res) => {
        try {

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Please do login first",
                });
            }

            const transaction = req.transaction || null;
            
            await Admin.update({
                auth_token: ''
            }, {
                where: {
                    id: req.user.id
                },
                transaction
            });

            // Getting Client ip
            let getClientIp = helperFunc.getClientIp(req)
            await logMiddleware(
                globalVariable.globalAdminActions.Logout,
                req.user.id,
                "User Logged out, email: " + req.user.email,
                getClientIp,
                "Logout",
                transaction
            );

            return res.clearCookie("authorization").status(200).json({
                success: true,
                message: "Logged out successfully",
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
}