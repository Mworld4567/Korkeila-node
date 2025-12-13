const express = require("express");
const Router = express.Router();
const permissionController = require('../http/Controllers/permissionController');
const authMiddleware = require("../http/middlewares/authMiddleware");

Router.get("/", authMiddleware, permissionController().read);
Router.get("/user", authMiddleware, permissionController().readUserPermission);

module.exports = Router; 