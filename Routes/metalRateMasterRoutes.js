const express = require("express");
const Router = express.Router();
const metalRateMasterController = require('../http/Controllers/metalRateMasterController');
const authMiddleware = require("../http/middlewares/authMiddleware");

Router.post("/create", authMiddleware, metalRateMasterController().create);
Router.get("/read", authMiddleware, metalRateMasterController().read);
Router.get("/karat-read", authMiddleware, metalRateMasterController().karatRead);
Router.get("/dropdown", authMiddleware, metalRateMasterController().metalRateMasterDropdown);
module.exports = Router; 