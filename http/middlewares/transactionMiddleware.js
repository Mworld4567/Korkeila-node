const sequelize = require("../../config/dbconfig");

/**
 * Middleware to wrap route handlers with database transactions
 * Automatically commits on success and rolls back on error
 */
const transactionMiddleware = (handler) => {
    return async (req, res, next) => {
        const transaction = await sequelize.transaction();
        
        // Attach transaction to request object
        req.transaction = transaction;
        
        // Store original methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        const originalStatus = res.status.bind(res);
        let committed = false;
        let statusCode = 200;
        
        // Helper function to commit/rollback transaction
        const handleTransaction = async (shouldCommit) => {
            if (!committed) {
                committed = true;
                try {
                    if (shouldCommit && statusCode < 400) {
                        await transaction.commit();
                    } else {
                        await transaction.rollback();
                    }
                } catch (error) {
                    console.error("Transaction error:", error);
                    try {
                        await transaction.rollback();
                    } catch (rollbackError) {
                        console.error("Transaction rollback error:", rollbackError);
                    }
                }
            }
        };
        
        // Override res.status to track status code
        res.status = function(code) {
            statusCode = code;
            return originalStatus(code);
        };
        
        // Override res.json to commit transaction before sending response
        res.json = async function(data) {
            await handleTransaction(true);
            return originalJson(data);
        };
        
        // Override res.send to commit transaction before sending response
        res.send = async function(data) {
            await handleTransaction(true);
            return originalSend(data);
        };
        
        try {
            // Call the handler
            await handler(req, res, next);
            
            // If response wasn't sent and no error occurred, commit
            if (!committed && !res.headersSent) {
                committed = true;
                try {
                    await transaction.commit();
                } catch (error) {
                    console.error("Transaction commit error:", error);
                    await transaction.rollback();
                }
            }
        } catch (error) {
            // Rollback transaction on error
            if (!committed) {
                committed = true;
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error("Transaction rollback error:", rollbackError);
                }
            }
            // Pass error to error handling middleware
            next(error);
        }
    };
};

module.exports = transactionMiddleware;
