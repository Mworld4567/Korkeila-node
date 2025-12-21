const express = require("express");
const Router = express.Router();
const subCategoryController = require('../http/Controllers/subCategoryController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(subCategoryController().create));
Router.get("/read", authMiddleware, subCategoryController().read);
Router.get("/readOne/:id", authMiddleware, subCategoryController().readOne);
Router.get("/readByCategory/:category_id", authMiddleware, subCategoryController().readByCategory);
Router.put("/update/:id", authMiddleware, transactionMiddleware(subCategoryController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(subCategoryController().delete));

module.exports = Router;
