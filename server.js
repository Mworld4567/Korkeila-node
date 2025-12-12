require("dotenv").config();
const express = require("express");
const app = express();
const moment = require("moment");
const cors = require("cors");
const cookieParser = require("cookie-parser");
global.__basedir = __dirname;
require("./cron");
const WHITELIST_IP = process.env.WHITELIST_IP;
const IS_WHITELIST_IP_BY_PASS = process.env.IS_WHITELIST_IP_BY_PASS;
const Routes = require('./Routes/index');
const logger = require("./logger/index");
const PATH = require('path');
const PORT = process.env.PORT;
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 15 });
const cache2 = new NodeCache({ stdTTL: 5 });

app.use(cors());
app.use(express.json({
  limit: '1024mb'
}));

app.use(cookieParser());


app.use((error, req, res, next) => {
  res.status(500).send("Could not perform the action");
});
app.use(async (req, res, next) => {
  let remoteAddress = req.ip;
  const logNumber = moment().format("YYYYMMDDhhmmss");
  req.headers.lognumber = logNumber;
  reqoriginalUrl = req.originalUrl;
  req.headers.ip = remoteAddress;
  let WHITELIST_IPS = WHITELIST_IP.split(",");
  let LogText = `${remoteAddress} Case - ${logNumber} - ${req.method} - ${req.originalUrl
    } ==> ${JSON.stringify(req.body)}`;
  if (req.method != "OPTIONS") {
    console.log(LogText);
  }
  logger.info(LogText);
  if (req.headers['x-mobile-app'] === 'true' || req.headers['x-catalogue-site'] === 'true') {
    next();
  } else {
    if (WHITELIST_IPS.includes(remoteAddress) || IS_WHITELIST_IP_BY_PASS == "true") {
      req.setTimeout(500000);
      next();
    } else {
      res.status(401).json({
        message: "Your IP is restricted to login.",
        success: false
      });
    }
  }
});

app.use(express.static(PATH.join(__dirname, 'public', 'uploads')));

app.use('/', Routes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});