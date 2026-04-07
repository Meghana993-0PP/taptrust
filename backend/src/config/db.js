/**
 * MySQL database connection pool using mysql2/promise.
 * Reads connection settings from environment variables.
 */

const mysql = require('mysql2/promise');

// Support both custom DB_* vars and Railway's MYSQL* vars
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'taptrust',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: '+00:00',
});

/**
 * Test the database connection on startup.
 * Throws if the connection cannot be established.
 */
async function testConnection() {
  const conn = await pool.getConnection();
  console.log('[DB] MySQL connection established successfully.');
  conn.release();
}

module.exports = { pool, testConnection };
