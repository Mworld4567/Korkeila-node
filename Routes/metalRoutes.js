const express = require("express");
const Router = express.Router();
const metalController = require('../http/Controllers/metalController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(metalController().create));
Router.get("/read", authMiddleware, metalController().read);
Router.get("/readOne/:id", authMiddleware, metalController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(metalController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(metalController().delete));

module.exports = Router; 