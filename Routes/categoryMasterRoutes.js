const express = require("express");
const Router = express.Router();
const categoryMasterController = require('../http/Controllers/CategoryMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, categoryMasterController().create);
Router.get("/read", authMiddleware, categoryMasterController().read);
Router.get("/readParentCategories", authMiddleware, categoryMasterController().readParentCategories);
Router.get("/readOne/:id", authMiddleware, categoryMasterController().readOne);
Router.put("/update/:id", authMiddleware, categoryMasterController().update);
Router.delete("/delete/:id", authMiddleware, categoryMasterController().delete);

module.exports = Router;

