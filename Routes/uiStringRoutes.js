const express = require("express");
const Router = express.Router();
const uiStringController = require('../http/Controllers/uiStringController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(uiStringController().create));
Router.get("/read", authMiddleware, uiStringController().read);
Router.get("/readOne/:id", authMiddleware, uiStringController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(uiStringController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(uiStringController().delete));

module.exports = Router;
