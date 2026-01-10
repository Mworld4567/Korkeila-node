const express = require("express");
const Router = express.Router();
const designController = require('../http/Controllers/designController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadDesignFilesInS3, uploadInS3FileDownload } = require("../http/middlewares/awsS3Middleware");

// Router.post("/preview", authMiddleware, designController().previewCombinations);
// Accept multiple files with field name 'images' (or any field name)
Router.post("/create", authMiddleware, uploadDesignFilesInS3.array('images'), transactionMiddleware(designController().create));
// Router.post("/upload-csv", authMiddleware, uploadInS3File.single('file'), transactionMiddleware(designController().uploadCsv));
Router.put("/update/:id", authMiddleware, uploadDesignFilesInS3.array('images'), transactionMiddleware(designController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(designController().delete));
Router.delete("/delete-image/:id", authMiddleware, designController().deleteDesignImage);
Router.get("/read", authMiddleware, designController().read);
Router.get("/readOne/:id", authMiddleware, designController().readOne);
Router.get("/related-variant-images", authMiddleware, designController().getRelatedVariantImages);
//ecom endpoints
Router.get("/variant-details-ecom", designController().variantDetailsForEcom);
Router.get("/filter-dropdowns-ecom", designController().filterDropdownsEcom);
Router.post("/upload-csv", authMiddleware, uploadInS3FileDownload.single('file'), designController().uploadCsv);
Router.post("/update-csv", authMiddleware, uploadInS3FileDownload.single('file'), designController().updateCsv);
Router.get("/related-product-details-ecom", designController().relatedProductDetailsForEcom);
// Router.post("/update-csv-design", authMiddleware, uploadInS3FileDownload.single('file'), designController().updateVariantBySkuCsv);


Router.get("/exportDesign", authMiddleware, designController().exportDesign);

module.exports = Router;

