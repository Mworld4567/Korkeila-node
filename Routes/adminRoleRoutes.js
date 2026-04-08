const express = require("express");
const Router = express.Router(); //type of this is function
const adminRoleController = require("../http/Controllers/adminRoleController");
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(adminRoleController().create));
Router.get("/read", authMiddleware, adminRoleController().read);
Router.get("/readone/:id", authMiddleware, adminRoleController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(adminRoleController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(adminRoleController().delete));


module.exports = Router;

// nirmit shah