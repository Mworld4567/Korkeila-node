const dateFunc = require("./dateFunc");
const sequelize = require("../config/dbconfig");


const helperObj = {
    getClientIp: (req) => {
        let returnIP = "";
        let ipString =
          req.headers["x-real-ip"] ||
          req.headers["x-forwarded-for"] ||
          (req.connection && req.connection.remoteAddress) || (req.socket && req.socket.remoteAddress);
    
        if (ipString.indexOf(",") > -1) {
          ipString = ipString.split(",");
          returnIP = ipString[0];
        } else {
          returnIP = ipString;
        }
        return returnIP;
      },
    /**
     * Wraps an async function with a database transaction
     * @param {Function} fn - The async function to wrap with transaction
     * @returns {Function} - Wrapped function that handles transaction
     */
    withTransaction: (fn) => {
        return async (...args) => {
            const transaction = await sequelize.transaction();
            try {
                // Pass transaction as the last argument
                const result = await fn(...args, transaction);
                await transaction.commit();
                return result;
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        };
    },
};

module.exports = helperObj;