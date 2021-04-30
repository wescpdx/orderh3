const log = require('../bin/logger');
const V = require('voca');

// Database setup
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
log.logInfo('h3db.pg: Connected to database');

const validUserObject = function(user) {
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

const validHasherObject = function(hasher) {
  if (typeof hasher.id !== "number") {
    log.logError(`h3db.validHasherObject: Invalid hasher id: ${hasher.id}`);
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
    if (!validUserObject(user)) {
      log.logError('h3db.updateUserByAuth: Invalid user data.');
      return;
    }
    try {
      const res = await pool.query('UPDATE auth_user SET name = $1, email = $2, updated = NOW() WHERE google_key = $3',
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
  },

  createNewUser: async function(user) {
    if (!validUserObject(user)) {
      log.logError('h3db.createNewUser: Invalid user data.');
      return;
    }
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
  },

  fetchHasherById: async function(id) {
    try {
      const res = await pool.query(`SELECT id, real_name, hash_name, fb_name, fb_url, kennel, notes
        FROM hasher WHERE id = $1`, [ id ]);
      log.logVerbose(`h3db.fetchHasherById: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount === 1) {
        return res.rows[0];
      } else if (res.rowCount === 0) {
        return {};
      } else {
        throw(new Error(`h3db.fetchHasherById: Failure to query for hasher id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchHasherById: Error querying database - ' + e.message);
      return undefined;
    }
  },

  updateHasher: async function(hasher) {
    if (!validHasherObject(hasher)) {
      log.logError('h3db.updateHasherById: Invalid hasher data.');
      return;
    }
    try {
      const res = await pool.query(`UPDATE hasher SET real_name = $1, hash_name = $2,
        fb_name = $3, fb_url = $4, kennel = $5, notes = $6, updated = NOW()
        WHERE id = $7`,
        [hasher.real_name, hasher.hash_name, hasher.fb_name, hasher.fb_url, hasher.kennel, hasher.notes, hasher.id]);
      log.logVerbose(`h3db.updateHasherById: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully updated hasher ${hasher.hash_name}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to update hasher '${hasher.hash_name}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.updateHasherById: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  fetchEventListByHasherId: async function(id) {
    try {
      const res = await pool.query(`SELECT e.id, e.kennel, e.title, e.number, e.ev_date, e.location, e.notes
        FROM event e JOIN event_hashers eh ON eh.event = e.id  WHERE eh.hasher = $1`, [ id ]);
      log.logVerbose(`h3db.fetchEventListByHasherId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 1) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchEventListByHasherId: Failure to query for hasher id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchEventListByHasherId: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchKennelList: async function() {
    try {
      const { rows } = await pool.query(`SELECT id, name FROM kennel ORDER BY name`);
      return rows;
    } catch(e) {
      log.logError('h3db.fetchKennelList: Error querying database -' + e.message);
    }
  },

  fetchHasherFullRecord: async function(id) {
    const hasher = await h3db.fetchHasherById(id);
    hasher.events = await h3db.fetchEventListByHasherId(id);
    console.log("fetchHasherFullRecord: Did the thing");
    return hasher;
  },

  reportOnHonorsDue: async function(kennel) {
    if (!kennel > 0) {
      log.logError('h3db.reportOnHonorsDue: Invalid kennel ID.');
      return;
    }
    try {
      const res = await pool.query(`
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num
          FROM hasher_attendance a
          JOIN honor_def hd
           ON a.hashes > hd.num
          LEFT OUTER JOIN honor_delivery hdd
           ON hdd.honor = hd.id AND hdd.hasher = a.hasher_id
          WHERE hd.kennel = $1
           AND hd.type = 'hash'
           AND hdd.id IS NULL
        UNION
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num
          FROM hasher_hares a
          JOIN honor_def hd
           ON a.hashes > hd.num
          LEFT OUTER JOIN honor_delivery hdd
           ON hdd.honor = hd.id AND hdd.hasher = a.hasher_id
          WHERE hd.kennel = $1
           AND hd.type = 'hare'
           AND hdd.id IS NULL
        UNION
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num
          FROM hasher_jedi a
          JOIN honor_def hd
           ON a.hashes > hd.num
          LEFT OUTER JOIN honor_delivery hdd
           ON hdd.honor = hd.id AND hdd.hasher = a.hasher_id
          WHERE hd.kennel = $1
           AND hd.type = 'jedi'
           AND hdd.id IS NULL
        `, [kennel]);
      log.logVerbose(`h3db.reportOnHonorsDue: ${res.command} query issued, ${res.rowCount} rows affected`);
      return res.rows;
    } catch(e) {
      log.logError('h3db.reportOnHonorsDue: Error querying database -' + e.message);
    }
  }


};


module.exports = h3db;
