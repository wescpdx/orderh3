const log = require('../bin/logger');
const V = require('voca');

// Database setup
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
log.logInfo('h3db.pg: Connected to database');

const validUser = function(user) {
  if (!user.key) {
    log.logError(`h3db.validateUser: No user.key`);
    return false;
  }
  if (typeof user.name !== 'string') {
    log.logError(`h3db.validateUser: Invalid name = ${user.name}`);
    return false;
  }
  if (typeof user.email !== 'string') {
    log.logError(`h3db.validateUser: Invalid email = ${user.email}`);
    return false;
  }
  return true;
}

const h3db = {

  fetchUserByAuth: async function(key) {
    try {
      const res = await pool.query('SELECT id, name, email, permissions FROM auth_user WHERE google_key = $1', [ key ]);
      log.logVerbose(`h3db.fetchUserByAuth: ${res.command} query issued, ${res.rowCount} rows affected`);
      return res.rows;
    } catch(e) {
      log.logError('h3db.fetchUserByAuth: Error querying database - ' + e.message);
      return undefined;
    }
  },

  updateUserByAuth: async function(user) {
    if (validUser(user)) {
      try {
        const res = await pool.query('UPDATE auth_user SET name = $1, email = $2 WHERE google_key = $3',
          [user.name, user.email, user.key]);
        log.logVerbose(`h3db.updateUserByAuth: ${res.command} query issued, ${res.rowCount} rows affected`);
        if (res.rowCount > 0) {
          log.logInfo(`Successfully updated user ${user.name}`);
          return user;
        } else {
          throw(new Error(`Failure to update user '${user.name}' in database, zero rows affected.`));
        }
      } catch(e) {
        log.logError('h3db.updateUserByAuth: Error querying database -' + e.message);
      }
    } else {
      log.logError('h3db.updateUserByAuth: Invalid user data.');
    }
  },

  createNewUser: async function(user) {
    if (validUser(user)) {
      try {
        const res = await pool.query('INSERT INTO auth_user (google_key, name, email, permissions) VALUES ($1, $2, $3, $4)',
          [user.key, user.name, user.email, 'pending']);
        log.logVerbose(`h3db.createNewUser: ${res.command} query issued, ${res.rowCount} rows affected`);
        if (res.rowCount > 0) {
          delete user.new;
          return user;
        } else {
          throw(new Error(`Failure to create user '${user.name}' in database, zero rows affected.`));
        }
      } catch(e) {
        log.logError('h3db.createNewUser: Error querying database -' + e.message);
      }
    } else {
      log.logError('h3db.createNewUser: Invalid user data.');
    }
  },


};


module.exports = h3db;
