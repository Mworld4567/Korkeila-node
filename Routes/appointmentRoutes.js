const express = require("express");
const Router = express.Router(); //type of this is function
const appointmentController = require("../http/Controllers/appointmentController");
const transactionMiddleware = require("../http/middlewares/transactionMiddleware");

Router.post("/create", transactionMiddleware(appointmentController().create));
Router.get("/timeslots", appointmentController().getTimeSlots);
Router.get("/countries", appointmentController().getCountries);

Router.post("/disable-date-and-time-slots", appointmentController().disableDateAndTimeSlots);



module.exports = Router;