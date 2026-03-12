const Router = require("express").Router();
const authMiddleware = require("../http/middlewares/authMiddleware");
const currencyRateController = require("../http/Controllers/currencyRateController");

// Public route for website to know which currencies are visible
Router.get("/public-visible", currencyRateController().publicVisible);

Router.get("/read", authMiddleware, currencyRateController().read);
Router.get("/readOne/:id", authMiddleware, currencyRateController().readOne);
Router.post("/create", authMiddleware, currencyRateController().create);
Router.put("/update/:id", authMiddleware, currencyRateController().update);

module.exports = Router;
