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
};

const parseHasherList = function(list) {
  if (typeof list === "number") {
    return list + "";
  }
  if (list instanceof Array) {
    return list.filter(ele => typeof ele === "number").join(",");
  }
  return "";
};

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
};

const validHasherObject = function(hasher) {
  if (typeof hasher.id !== "number") {
    log.logError(`h3db.validHasherObject: Invalid hasher id: ${hasher.id}`);
    return false;
  }
  return true;
};

const validHasherLinkData = function(linkData) {
  if (typeof linkData.event !== "number") {
    log.logError(`h3db.validHasherLinkData: Invalid event id: ${linkData.event} of type ${typeof linkData.event}`);
    console.log(`DEBUG::linkData=${JSON.stringify(linkData)}`);
    return false;
  }
  if (typeof linkData.hasher !== "number") {
    log.logError(`h3db.validHasherLinkData: Invalid hasher id: ${linkData.hasher} of type ${typeof linkData.hasher}`);
    return false;
  }
  if (typeof linkData.hare !== "boolean") {
    log.logError(`h3db.validHasherLinkData: Invalid hare flag: ${linkData.hare} of type ${typeof linkData.hare}`);
    return false;
  }
  if (typeof linkData.jedi !== "boolean") {
    log.logError(`h3db.validHasherLinkData: Invalid jedi flag: ${linkData.jedi} of type ${typeof linkData.jedi}`);
    return false;
  }
  return true;
};

const validAwardLinkData = function(linkData) {
  if (typeof linkData.event !== "number") {
    log.logError(`h3db.validAwardLinkData: Invalid event id: ${linkData.event} of type ${typeof linkData.event}`);
    console.log(`DEBUG::linkData=${JSON.stringify(linkData)}`);
    return false;
  }
  if (typeof linkData.hasher !== "number") {
    log.logError(`h3db.validAwardLinkData: Invalid hasher id: ${linkData.hasher} of type ${typeof linkData.hasher}`);
    return false;
  }
  if (typeof linkData.honor !== "number") {
    log.logError(`h3db.validAwardLinkData: Invalid hare flag: ${linkData.hare} of type ${typeof linkData.hare}`);
    return false;
  }
  return true;
};

const validEventObject = function(event) {
  if (typeof event.id !== "number") {
    log.logError(`h3db.validEventObject: Invalid event id: ${event.id}`);
    return false;
  }
  return true;
};

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

  fetchEventListByMostRecent: async function() {
    try {
      const res = await pool.query(`SELECT id, kennel, title, number, TO_CHAR(ev_date, 'yyyy-mm-dd') as ev_date,
      location, notes
        FROM event ORDER BY updated DESC LIMIT 10`);
      log.logVerbose(`h3db.fetchEventListByMostRecent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchEventListByMostRecent: Failure to query for most recent events in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchEventListByMostRecent: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchEventListBySearchTerm: async function(term) {
    try {
      const res = await pool.query(`SELECT id, kennel, title, number, TO_CHAR(ev_date, 'yyyy-mm-dd') as ev_date,
      location, notes
        FROM event WHERE title ILIKE $1 OR number = $2`, [ `%${term}%`, parseInt(term) || 0 ]);
      log.logVerbose(`h3db.fetchEventListBySearchTerm: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchEventListBySearchTerm: Failure to query for search term ${term}.`));
      }
    } catch(e) {
      log.logError('h3db.fetchEventListBySearchTerm: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchEventListByHasherId: async function(id) {
    try {
      const res = await pool.query(`SELECT e.id, e.kennel, e.title, e.number, TO_CHAR(e.ev_date, 'yyyy-mm-dd') as ev_date,
      e.location, e.notes, eh.hare, eh.jedi
        FROM event e JOIN event_hashers eh ON eh.event = e.id  WHERE eh.hasher = $1`, [ id ]);
      log.logVerbose(`h3db.fetchEventListByHasherId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
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

  fetchHasherListByMostRecent: async function(id) {
    try {
      const res = await pool.query(`SELECT id, real_name, hash_name
        FROM hasher ORDER BY updated LIMIT 10`);
      log.logVerbose(`h3db.fetchHasherListByMostRecent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchHasherListByMostRecent: Failure to query for event id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchHasherListByMostRecent: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchHasherListExceptEvent: async function(id) {
    try {
      const res = await pool.query(`SELECT id, real_name, hash_name FROM hasher
        WHERE id NOT IN (SELECT hasher FROM event_hashers WHERE event = $1)
        ORDER BY hash_name`, [id]);
      log.logVerbose(`h3db.fetchHasherList: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchHasherList: Failure to query for event id='${id}' in database.`));
      }
    } catch(e) {
      log.logError('h3db.fetchHasherList: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchHasherListBySearchTerm: async function(term) {
    try {
      const res = await pool.query(`SELECT id, real_name, hash_name
        FROM hasher WHERE real_name ILIKE $1 OR hash_name ILIKE $1`, [ `%${term}%` ]);
      log.logVerbose(`h3db.fetchHasherListBySearchTerm: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        return res.rows;
      } else if (res.rowCount === 0) {
        return [];
      } else {
        throw(new Error(`h3db.fetchHasherListBySearchTerm: Failure to query for search term ${term}`));
      }
    } catch(e) {
      log.logError('h3db.fetchHasherListBySearchTerm: Error querying database - ' + e.message);
      return undefined;
    }
  },

  fetchHasherListByEventId: async function(id) {
    try {
      const res = await pool.query(`SELECT h.id, h.real_name, h.hash_name, eh.hare, eh.jedi
        FROM hasher h JOIN event_hashers eh ON eh.hasher = h.id  WHERE eh.event = $1`, [ id ]);
      log.logVerbose(`h3db.fetchHasherListByEventId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
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
      if (res.rowCount > 0) {
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
      const res = await pool.query(`SELECT hh.id AS hasher_id, hh.hash_name, h.type, h.num, h.title, TO_CHAR(e.ev_date, 'yyyy-mm-dd') as ev_date
        FROM honor_delivery d
        JOIN honor_def h ON d.honor = h.id
        JOIN event e ON d.event = e.id
        JOIN hasher hh ON d.hasher = hh.id
        WHERE d.event = $1`, [ id ]);
      log.logVerbose(`h3db.fetchAwardListByEventId: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
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

  createHasher: async function(hasher) {
    if (!validHasherObject(hasher)) {
      log.logError('h3db.createHasher: Invalid hasher data.');
      return;
    }
    try {
      const res = await pool.query(`INSERT INTO hasher (real_name, hash_name, fb_name, fb_url, kennel, notes, updated)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [hasher.real_name, hasher.hash_name, hasher.fb_name, hasher.fb_url, hasher.kennel, hasher.notes]);
      log.logVerbose(`h3db.createHasher: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully created hasher record for ${hasher.hash_name}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to create hasher '${hasher.hash_name}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.createHasher: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  updateHasher: async function(hasher) {
    if (!validHasherObject(hasher)) {
      log.logError('h3db.updateHasher: Invalid hasher data.');
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

  createEvent: async function(eventData) {
    if (!validEventObject(eventData)) {
      log.logError('h3db.updateEvent: Invalid event data.');
      return;
    }
    try {
      const res = await pool.query(`INSERT INTO event (kennel, title, number, ev_date, location, notes, updated)
        VALUES($1, $2, $3, $4, $5, $6)`,
        [eventData.kennel, eventData.title, parseInt(eventData.number), eventData.ev_date, eventData.location, eventData.notes]);
      log.logVerbose(`h3db.createEvent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully created new event ${eventData.title}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to create new event '${eventData.title}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.createEvent: Error querying database -' + e.message);
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
        log.logInfo(`Successfully updated event ${eventData.title}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to update event '${eventData.title}' in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.updateEvent: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  addHasherToEvent: async function(linkData) {
    if (!validHasherLinkData(linkData)) {
      log.logError('h3db.addHasherToEvent: Invalid link data.');
      return;
    }
    try {
      const res = await pool.query(`INSERT INTO event_hashers (event, hasher, hare, jedi)
        VALUES($1, $2, $3, $4)`,
        [linkData.event, linkData.hasher, linkData.hare, linkData.jedi]);
      log.logVerbose(`h3db.addHasherToEvent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully linked hasher ${linkData.hasher} to event ${linkData.event}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to link hasher ${linkData.hasher} to event ${linkData.event} in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.addHasherToEvent: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  addAwardDelivery: async function(linkData) {
    console.log(`LINK data::${JSON.stringify(linkData)}`);
    if (!validAwardLinkData(linkData)) {
      log.logError('h3db.addAwardDelivery: Invalid link data.');
      return;
    }
    try {
      const res = await pool.query(`INSERT INTO honor_delivery (honor, hasher, event)
        VALUES($1, $2, $3)`,
        [linkData.honor, linkData.hasher, linkData.event]);
      log.logVerbose(`h3db.addAwardDelivery: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully linked award ${linkData.honor} to event ${linkData.event}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to link award ${linkData.honor} to event ${linkData.event} in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.addAwardDelivery: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  addAwardDeliveryAll: async function(linkArray) {
    if (!linkArray instanceof Array) {
      log.logError('h3db.addAwardDeliveryAll: Invalid link data.');
      return;
    }
    try {
      console.log(`LINK ARRAY::${JSON.stringify(linkArray)}`);
      const resultArray = [];
      for (const i in linkArray) {
        resultArray.push(await h3db.addAwardDelivery(linkArray[i]));
      }
      return resultArray;
    } catch(e) {
      log.logError('h3db.addAwardDeliveryAll: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  removeHashersFromEvent: async function(hasherList, eventId) {
    const scrubbedHasherList = parseHasherList(hasherList);
    if (typeof eventId !== "number") {
      log.logError('h3db.removeHashersFromEvent: Invalid event id.');
      return;
    }
    try {
      console.log(`QUERY::DELETE FROM event_hashers WHERE hasher IN (${scrubbedHasherList}) AND event = ${eventId}`);
      const res = await pool.query(`DELETE FROM event_hashers WHERE hasher IN (${scrubbedHasherList}) AND event = $1`,
        [eventId]);
      log.logVerbose(`h3db.removeHashersFromEvent: ${res.command} query issued, ${res.rowCount} rows affected`);
      if (res.rowCount > 0) {
        log.logInfo(`Successfully unlinked hashers ${scrubbedHasherList} from event ${eventId}`);
        return { success: true };
      } else {
        throw(new Error(`Failure to unlink hashers ${scrubbedHasherList} from event ${eventId} in database, zero rows affected.`));
      }
    } catch(e) {
      log.logError('h3db.removeHashersFromEvent: Error querying database -' + e.message);
      return { success: false, error: e.message, stack: e.stack };
    }
  },

  fetchHonorsEarnedNextByKennel: async function(kennel) {
    if (!kennel > 0) {
      log.logError('h3db.fetchHonorsEarnedNextByKennel: Invalid kennel ID.');
      return;
    }
    try {
      const res = await pool.query(`SELECT hasher_id, hash_name, title, num, type
        FROM honors_earned_next WHERE kennel = $1`, [kennel]);
      log.logVerbose(`h3db.fetchHonorsEarnedNextByKennel: ${res.command} query issued, ${res.rowCount} rows affected`);
      return res.rows;
    } catch(e) {
      log.logError('h3db.fetchHonorsEarnedNextByKennel: Error querying database -' + e.message);
    }
  },

  fetchHonorsDueByEvent: async function(eventId) {
    if (!eventId > 0) {
      log.logError('h3db.fetchHonorsDueByEvent: Invalid event ID.');
      return;
    }
    try {
      const res = await pool.query(`SELECT a.hasher_id, a.honor_id, a.hash_name, a.title, a.num, a.type
        FROM honors_earned a
        JOIN event_hashers eh ON eh.hasher = a.hasher_id
        WHERE eh.event = $1`, [eventId]);
      log.logVerbose(`h3db.fetchHonorsDueByEvent: ${res.command} query issued, ${res.rowCount} rows affected`);
      return res.rows;
    } catch(e) {
      log.logError('h3db.fetchHonorsDueByEvent: Error querying database -' + e.message);
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

};


module.exports = h3db;
