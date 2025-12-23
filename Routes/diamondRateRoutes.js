const express = require("express");
const Router = express.Router();
const diamondRateController = require('../http/Controllers/diamondRateController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(diamondRateController().create));
Router.get("/read", authMiddleware, diamondRateController().read);
Router.get("/readOne/:id", authMiddleware, diamondRateController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(diamondRateController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(diamondRateController().delete));
Router.get("/dropdown", authMiddleware, diamondRateController().diamondRateDropdown);

module.exports = Router;
