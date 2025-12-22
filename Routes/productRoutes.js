const express = require("express");
const Router = express.Router();
const productController = require('../http/Controllers/productController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadInS3Image } = require("../http/middlewares/awsS3Middleware");

Router.post("/create", authMiddleware, uploadInS3Image.single("image"), transactionMiddleware(productController().create));
Router.get("/read", authMiddleware, productController().read);
Router.get("/readOne/:id", authMiddleware, productController().readOne);
Router.put("/update/:id", authMiddleware, uploadInS3Image.single("image"), transactionMiddleware(productController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(productController().delete));
Router.get("/dropdown", authMiddleware, productController().productDropdown);

module.exports = Router;
