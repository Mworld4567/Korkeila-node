const express = require("express");
const Router = express.Router();
const diamondClarityController = require('../http/Controllers/diamondClarityController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(diamondClarityController().create));
Router.get("/read", authMiddleware, diamondClarityController().read);
Router.get("/readOne/:id", authMiddleware, diamondClarityController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(diamondClarityController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(diamondClarityController().delete));

module.exports = Router;
