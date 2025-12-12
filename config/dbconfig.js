require('dotenv').config()
const { Sequelize } = require("sequelize");

let sequelize
if (!sequelize) {
  sequelize = new Sequelize(
    process.env.SQL_DB, process.env.SQL_USERNAME, process.env.SQL_PASSWORD,
    {
      host: process.env.HOST,
      dialect: process.env.DB,
      charset: 'utf8',
      collate: 'utf8_general_ci',
      dialectOptions: {
        connectTimeout: 60000, // 10 seconds to establish a connection
      },
      pool: {
        max: 60,
        min: 0,
        acquire: 60000,
        idle: 20000,
        waitForConnections: true,
      },
      logging: process.env.NODE_ENV == 'development' ? false : false
    }
  );
}

module.exports = sequelize;