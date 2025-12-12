const express = require("express");
const Router = express.Router();
const requireDirectory = require('require-directory');

const routes = requireDirectory(module, '.');
for (let route in routes) {
    let newRoute;
    if (route.includes('Routes')) {
        newRoute = route.replace('Routes', '');
    } else {
        newRoute = route;
    }
    // Not need to includes
    if ((!['permissionRoutes', 'loginRoutes', 'userLoginRoutes'].includes(route))) {
        Router.use(`/api/${newRoute}`, require(`./${route}`));
    }
    Router.use('/admin', require('./loginRoutes'));
    Router.use('/user', require('./userLoginRoutes'));
    Router.use("/admin/permission", require('./permissionRoutes'));
}

module.exports = Router;