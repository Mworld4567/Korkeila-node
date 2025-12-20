const express = require("express");
const Router = express.Router();
const diamondTypeController = require('../http/Controllers/diamondTypeController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(diamondTypeController().create));
Router.get("/read", authMiddleware, diamondTypeController().read);
Router.get("/readOne/:id", authMiddleware, diamondTypeController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(diamondTypeController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(diamondTypeController().delete));

module.exports = Router;
