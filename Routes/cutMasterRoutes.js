const express = require("express");
const Router = express.Router();
const cutMasterController = require('../http/Controllers/CutMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");
const { uploadInS3Image } = require("../http/middlewares/awsS3Middleware");

Router.post("/create", authMiddleware, uploadInS3Image.single("cut_image"), transactionMiddleware(cutMasterController().create));
Router.get("/read", authMiddleware, cutMasterController().read);
Router.get("/readOne/:id", authMiddleware, cutMasterController().readOne);
Router.put("/update/:id", authMiddleware, uploadInS3Image.single("cut_image"), transactionMiddleware(cutMasterController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(cutMasterController().delete));

module.exports = Router;

