const log = require('../bin/logger');
const V = require('voca');

// Database setup
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
log.logInfo('h3db.pg: Connected to database');


const h3db = {

  fetchUserByAuth: async function(key) {
    try {
      const { rows } = await pool.query('SELECT name, email, permissions FROM auth_user WHERE google_key = $1', key);
    } catch(e) {
      log.logError('h3db.fetchUserByAuth: Error querying database - ' + e.message);
      return undefined;
    }
    if (rows.length === 1) {
      return {
        name: rows[0].name,
        email: rows[0].email,
        permissions: rows[0].permissions,
      }
    } else if (rows.length === 0) {
      return {
        new: true,
        permissions: "none",
      }
    } else {
      log.logError('h3db.fetchUserByAuth: Duplicate user records for key: ' + key);
    }
  },

};


module.exports = h3db;
