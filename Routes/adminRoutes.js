const express = require("express");
const Router = express.Router(); //type of this is function
const adminController = require("../http/Controllers/adminController");
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(adminController().create));
Router.get("/read", authMiddleware, adminController().read);
Router.get("/readone/:id", authMiddleware, adminController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(adminController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(adminController().delete));


module.exports = Router;