const express = require("express");
const Router = express.Router();
const styleMasterController = require('../http/Controllers/StyleMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(styleMasterController().create));
Router.get("/read", authMiddleware, styleMasterController().read);
Router.get("/readOne/:id", authMiddleware, styleMasterController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(styleMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(styleMasterController().delete));

module.exports = Router;

