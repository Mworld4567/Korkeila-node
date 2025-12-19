const express = require("express");
const Router = express.Router();
const goldColorController = require('../http/Controllers/GoldColorController');
const authMiddleware = require("../http/middlewares/authMiddleware");

Router.post("/create", authMiddleware, goldColorController().create);
Router.get("/read", authMiddleware, goldColorController().read);
Router.get("/readOne/:id", authMiddleware, goldColorController().readOne);
Router.put("/update/:id", authMiddleware, goldColorController().update);
Router.delete("/delete/:id", authMiddleware, goldColorController().delete);

module.exports = Router;
