const express = require("express");
const Router = express.Router();
const designController = require('../http/Controllers/designController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

// Router.post("/preview", authMiddleware, designController().previewCombinations);
Router.post("/create", authMiddleware, transactionMiddleware(designController().create));
Router.get("/read", authMiddleware, designController().read);

//ecom endpoint
Router.get("/variant-details-ecom", designController().variantDetailsForEcom);

module.exports = Router;

