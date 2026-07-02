const { Pool, types } = require('pg');

// node-pg leaves NUMERIC and BIGINT as strings by default (to avoid silent
// precision loss); every value that reaches this app is small enough that a
// JS number is safe, and the controllers below expect plain numbers.
types.setTypeParser(20, (val) => parseInt(val, 10)); // BIGINT (e.g. COUNT(*), SUM())
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val))); // NUMERIC/DECIMAL

let pool;

async function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 15000,
  });
  await pool.query('SELECT 1');
  console.log('Connected to PostgreSQL');
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database not connected. Call connectDB() first.');
  return pool;
}

module.exports = { connectDB, getPool };
