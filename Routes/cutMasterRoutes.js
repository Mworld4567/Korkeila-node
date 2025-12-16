const express = require("express");
const Router = express.Router();
const cutMasterController = require('../http/Controllers/CutMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(cutMasterController().create));
Router.get("/read", authMiddleware, cutMasterController().read);
Router.get("/readOne/:id", authMiddleware, cutMasterController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(cutMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(cutMasterController().delete));

module.exports = Router;

