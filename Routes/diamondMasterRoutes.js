const express = require("express");
const Router = express.Router();
const diamondMasterController = require('../http/Controllers/DiamondMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(diamondMasterController().create));
Router.get("/read", authMiddleware, diamondMasterController().read);
Router.get("/readOne/:id", authMiddleware, diamondMasterController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(diamondMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(diamondMasterController().delete));

module.exports = Router;

