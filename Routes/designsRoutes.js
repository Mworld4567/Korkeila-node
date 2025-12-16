const express = require("express");
const Router = express.Router();
const designController = require('../http/Controllers/designController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(designController().create));
Router.get("/read", authMiddleware, designController().read);
Router.get("/readOne/:id", authMiddleware, designController().readOne);

module.exports = Router;

