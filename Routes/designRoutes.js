const express = require("express");
const Router = express.Router();
const designController = require('../http/Controllers/designController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadDesignFilesInS3 } = require("../http/middlewares/awsS3Middleware");

// Router.post("/preview", authMiddleware, designController().previewCombinations);
// Accept multiple files with field name 'images' (or any field name)
Router.post("/create", authMiddleware, uploadDesignFilesInS3.array('images'), transactionMiddleware(designController().create));
Router.get("/read", authMiddleware, designController().read);

//ecom endpoint
Router.get("/variant-details-ecom", designController().variantDetailsForEcom);

module.exports = Router;

