const express = require("express");
const Router = express.Router();
const categoryMasterController = require('../http/Controllers/CategoryMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadInS3Image } = require("../http/middlewares/awsS3Middleware");

Router.post("/create", authMiddleware, uploadInS3Image.single("image"), transactionMiddleware(categoryMasterController().create));
Router.get("/read", authMiddleware, categoryMasterController().read);
Router.get("/readOne/:id", authMiddleware, categoryMasterController().readOne);
Router.put("/update/:id", authMiddleware, uploadInS3Image.single("image"), transactionMiddleware(categoryMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(categoryMasterController().delete));
Router.get("/dropdown", authMiddleware, categoryMasterController().categoryDropdown);

//ecom home page
Router.get("/home-page", categoryMasterController().categoryListingForEcomHomePage);
module.exports = Router;

