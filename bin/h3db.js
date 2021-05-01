const log = require('../bin/logger');
const V = require('voca');

// Database setup
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
log.logInfo('h3db.pg: Connected to database');

const toIsoDate = function(dd) {
  if (!(dd instanceof Date)) {
    dd = new Date(dd);
  }
  return `${dd.getFullYear()}-${('' + dd.getMonth()).padStart(2, '0')}-${('' + dd.getDate()).padStart(2, '0')}`;
}

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

const validEventObject = function(event) {
  if (typeof event.id !== "number") {
    log.logError(`h3db.validEventObject: Invalid event id: ${event.id}`);
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

  fetchEventById: async function(id) {
    try {
      const res = await pool.query(`SELECT id, kennel, title, number, TO_CHAR(ev_date, 'yyyy-mm-dd') as ev_date, location, notes
        FROM event WHERE id = $1`, [ id ]);
      log.logVerbose(`h3db.fetchEventById: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount === 1) {
        return res.rows[0];
      } else if (res.rowCount === 0) {
        return {};
      } else {
        throw(new Error(`h3db.fetchEventById: Failure to query for hasher id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchEventById: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchKennelById: async function(id) {
    try {
      const res = await pool.query(`SELECT id, name
        FROM kennel WHERE id = $1`, [ id ]);
      log.logVerbose(`h3db.fetchKennelById: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount === 1) {
        return res.rows[0];
      } else if (res.rowCount === 0) {
        return {};
      } else {
        throw(new Error(`h3db.fetchKennelById: Failure to query for kennel id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchKennelById: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchEventListByHasherId: async function(id) {
    try {
      const res = await pool.query(`SELECT e.id, e.kennel, e.title, e.number, TO_CHAR(e.ev_date, 'yyyy-mm-dd') as ev_date, e.location, e.notes
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

  fetchHasherListByEventId: async function(id) {
    try {
      const res = await pool.query(`SELECT h.id, h.real_name, h.hash_name, eh.hare, eh.jedi
        FROM hasher h JOIN event_hashers eh ON eh.hasher = h.id  WHERE eh.event = $1`, [ id ]);
      log.logVerbose(`h3db.fetchHasherListByEventId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 1) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchHasherListByEventId: Failure to query for event id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchHasherListByEventId: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchAwardListByHasherId: async function(id) {
    try {
      const res = await pool.query(`SELECT h.type, h.num, h.title, TO_CHAR(e.ev_date, 'yyyy-mm-dd') as ev_date
        FROM honor_delivery d
        JOIN honor_def h ON d.honor = h.id
        JOIN event e ON d.event = e.id
        WHERE d.hasher = $1`, [ id ]);
      log.logVerbose(`h3db.fetchAwardListByHasherId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 1) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchAwardListByHasherId: Failure to query for hasher id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchAwardListByHasherId: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchAwardListByEventId: async function(id) {
    try {
      const res = await pool.query(`SELECT h.type, h.num, h.title, TO_CHAR(e.ev_date, 'yyyy-mm-dd') as ev_date
        FROM honor_delivery d
        JOIN honor_def h ON d.honor = h.id
        JOIN event e ON d.event = e.id
        WHERE d.event = $1`, [ id ]);
      log.logVerbose(`h3db.fetchAwardListByEventId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 1) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchAwardListByEventId: Failure to query for event id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchAwardListByEventId: Error querying database - ' + e.message);
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
      log.logVerbose(`h3db.updateHasher: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully updated hasher ${hasher.hash_name}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to update hasher '${hasher.hash_name}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.updateHasher: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  updateEvent: async function(eventData) {
    if (!validEventObject(eventData)) {
      log.logError('h3db.updateEvent: Invalid event data.');
      return;
    }
    try {
      const res = await pool.query(`UPDATE event SET kennel = $1, title = $2,
        number = $3, ev_date = $4, location = $5, notes = $6, updated = NOW()
        WHERE id = $7`,
        [eventData.kennel, eventData.title, parseInt(eventData.number), eventData.ev_date, eventData.location, eventData.notes, eventData.id]);
      log.logVerbose(`h3db.updateEvent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully updated hasher ${eventData.title}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to update hasher '${eventData.title}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.updateEvent: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
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
    hasher.kennel = await h3db.fetchKennelById(hasher.kennel);
    hasher.awards = await h3db.fetchAwardListByHasherId(id);
    return hasher;
  },

  fetchEventFullRecord: async function(id) {
    const eventData = await h3db.fetchEventById(id);
    eventData.hashers = await h3db.fetchHasherListByEventId(id);
    eventData.kennel = await h3db.fetchKennelById(eventData.kennel);
    eventData.awards = await h3db.fetchAwardListByEventId(id);
    return eventData;
  },

  reportOnHonorsDue: async function(kennel) {
    if (!kennel > 0) {
      log.logError('h3db.reportOnHonorsDue: Invalid kennel ID.');
      return;
    }
    try {
      const res = await pool.query(`
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num, hd.type
          FROM hasher_attendance a
          JOIN honor_def hd
           ON a.hashes > hd.num
          LEFT OUTER JOIN honor_delivery hdd
           ON hdd.honor = hd.id AND hdd.hasher = a.hasher_id
          WHERE hd.kennel = $1
           AND hd.type = 'hash'
           AND hdd.id IS NULL
        UNION
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num, hd.type
          FROM hasher_hares a
          JOIN honor_def hd
           ON a.hares > hd.num
          LEFT OUTER JOIN honor_delivery hdd
           ON hdd.honor = hd.id AND hdd.hasher = a.hasher_id
          WHERE hd.kennel = $1
           AND hd.type = 'hare'
           AND hdd.id IS NULL
        UNION
          SELECT a.hasher_id, a.hash_name, hd.title, hd.num, hd.type
          FROM hasher_jedi a
          JOIN honor_def hd
           ON a.jedi > hd.num
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
