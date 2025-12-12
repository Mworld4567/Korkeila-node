const mysql = require('mysql');
require('dotenv').config();

const mysqlCon = {
	host: process.env.HOST,
	user: process.env.SQL_USERNAME,
	password: process.env.SQL_PASSWORD,
	database: process.env.SQL_DB,
	connectionLimit: 60, // Maximum number of connections in the pool
	waitForConnections: true, // Wait for connections to be released before throwing errors
	connectTimeout: 30000, // 10 seconds timeout for initial connection
	acquireTimeout: 60000, // Timeout for acquiring a connection from the pool
};

const pool = mysql.createPool(mysqlCon);

pool.getConnection((err, connection) => {
	if (err) {
		if (err.code === 'ETIMEDOUT') {
			console.error('Connection attempt timed out');
		} else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
			console.error('Invalid credentials for MySQL');
		} else if (err.code === 'ENOTFOUND') {
			console.error('MySQL host not found');
		} else {
			console.error('Database connection error:', err);
		}
	} else {
		console.log('Successfully connected to the database!');
		connection.release(); // Release the connection back to the pool
	}
});

module.exports = pool;
