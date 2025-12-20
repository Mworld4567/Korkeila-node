const express = require("express");
const Router = express.Router();
const karatController = require('../http/Controllers/karatController');
const authMiddleware = require("../http/middlewares/authMiddleware");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", authMiddleware, transactionMiddleware(karatController().create));
Router.get("/read", authMiddleware, karatController().read);
Router.get("/readOne/:id", authMiddleware, karatController().readOne);
Router.put("/update/:id", authMiddleware, transactionMiddleware(karatController().update));
Router.delete("/delete/:id", authMiddleware, transactionMiddleware(karatController().delete));

module.exports = Router;
