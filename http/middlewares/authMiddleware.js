const jwt = require("jsonwebtoken");
require("dotenv").config();
const Admin = require("../../Models/Admin");
const logError = require("../../logger/log");
const RolePermission = require("../../Models/RolePermission");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.cookies['authorization'] || req.headers['authorization'];
  if (authHeader && authHeader.startsWith("Bearer")) {
    try {

      let token = authHeader.split(" ")[1];
      const data = jwt.verify(token, process.env.JWT_SECRET);
      const userData = await Admin.findByPk(data.user.id);

      if (!userData || userData.auth_token != token) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again.",
        });
      }

      
      req.user = userData.dataValues;

      let permissionData = await RolePermission.findAll({ where: { role_id: req.user.role_id }, });
      let admin_permission = permissionData.map((x) => {
        return x.dataValues.permission_id;
      });

      req.user.permissionarray = admin_permission;

      next();
    } catch (error) {
      console.log(error);
      logError(error, req);
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
    });
  }
};

module.exports = authMiddleware;