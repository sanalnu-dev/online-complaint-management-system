const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ocms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper for single queries
async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Helper to get raw connection for transactions
async function getConnection() {
  return await pool.getConnection();
}

// Test database connection
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true, message: 'Database connected successfully' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection
};
