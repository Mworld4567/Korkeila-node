const express = require("express");
const Router = express.Router();
const categoryMasterController = require('../http/Controllers/CategoryMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(categoryMasterController().create));
Router.get("/read", authMiddleware, categoryMasterController().read);
Router.get("/readOne/:id", authMiddleware, categoryMasterController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(categoryMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(categoryMasterController().delete));

module.exports = Router;

