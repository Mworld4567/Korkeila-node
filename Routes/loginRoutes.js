const express = require("express");
const Router = express.Router();
const loginController = require('../http/Controllers/loginController')
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/login", transactionMiddleware(loginController.userLogin));
Router.post("/token", transactionMiddleware(loginController.getAccessToken));
Router.post("/logout", authMiddleware, transactionMiddleware(loginController.userLogout));

module.exports = Router;