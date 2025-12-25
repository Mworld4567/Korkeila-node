const express = require("express");
const Router = express.Router();
const designController = require('../http/Controllers/designController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadDesignFilesInS3 } = require("../http/middlewares/awsS3Middleware");

// Router.post("/preview", authMiddleware, designController().previewCombinations);
// Accept multiple files with field name 'images' (or any field name)
Router.post("/create", authMiddleware, uploadDesignFilesInS3.array('images'), transactionMiddleware(designController().create));
Router.put("/update/:id", authMiddleware, uploadDesignFilesInS3.array('images'), transactionMiddleware(designController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(designController().delete));
Router.get("/read", authMiddleware, designController().read);
Router.get("/readOne/:id", authMiddleware, designController().readOne);

//ecom endpoints
Router.get("/variant-details-ecom", designController().variantDetailsForEcom);
Router.get("/filter-dropdowns-ecom", designController().filterDropdownsEcom);

module.exports = Router;

