const log = require('../bin/logger');
const db = require('../bin/h3db');

const auth = {

  isLoggedIn: function(req) {
    return req.user && req.user.uid ? true : false;
  },

  isDataEntry: function(req) {
    return (req.isAuthenticated() && (req.user.permissions === "data_entry" || req.user.permissions === "admin"));
  },

  getUserData: async function(key) {
    log.logVerbose(`auth.getUserData: Fetching data for key = ${key}`);
    const rows = await db.fetchUserByAuth(key);
    if (rows.length === 1) {
      return {
        name: rows[0].name,
        email: rows[0].email,
        permissions: rows[0].permissions,
        key: key,
      }
    } else if (rows.length === 0) {
      return {
        new: true,
        permissions: "none",
        key: key,
      }
    } else {
      log.logError('h3db.fetchUserByAuth: Duplicate user records for key: ' + key);
      return false;
    }
  },

  updateUserData: async function(user) {
    if (user.new) {
      return await db.createNewUser(user) || user;
    }
    return await db.updateUserByAuth(user) || user;
  },

  passportStategyConfig: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://${process.env.LOCAL_DOMAIN}/auth/google/callback`,
  },

  passportStrategyHandler: function(accessToken, refreshToken, profile, done) {
    log.logInfo('auth.passportStrategyHandler: Trying to authorize Google ID ' + profile.id);
    auth.getUserData(profile.id).then(function(usr) {
      log.logVerbose('auth.passportStrategyHandler: usr = ' + JSON.stringify(usr));
      return done(null, usr);
    });
  },

  // If not authenticated, bounce to /auth
  // router.use(auth.loginOnlyExpress);
  loginOnlyExpress: function(req, res, next) {
    if (req.isAuthenticated()) {
      log.logVerbose('auth.loginOnlyExpress: Auth passed');
      next();
    } else {
      log.logVerbose('auth.loginOnlyExpress: Auth failed');
      res.redirect('/auth');
    }
  },

  // If doesn't have data entry permissions, bounce to /profile
  // router.use(auth.dataEntryOnlyExpress);
  dataEntryOnlyExpress: function(req, res, next) {
    if (req.isAuthenticated() && (req.user.permissions === "data_entry" || req.user.permissions === "admin")) {
      log.logVerbose('auth.dataEntryOnlyExpress: Data entry user passed');
      next();
    } else {
      log.logVerbose('auth.dataEntryOnlyExpress: User does not have data entry permissions - user info = ' + JSON.stringify(req.user));
      res.redirect('/profile');
    }
  },

  // If doesn't have data entry permissions, respond with 401
  // router.use(auth.dataEntryOnlyApi);
  dataEntryOnlyApi: function(req, res, next) {
    if (req.isAuthenticated() && (req.user.permissions === "data_entry" || req.user.permissions === "admin")) {
      log.logVerbose('auth.dataEntryOnlyApi: Data entry user passed');
      next();
    } else {
      log.logVerbose('auth.dataEntryOnlyApi: User does not have data entry permissions - user info = ' + JSON.stringify(req.user));
      res.status(401).json({ error: "Authentication failed."});
    }
  },

  // If doesn't have admin permissions, bounce to /profile
  // router.use(auth.dataEntryOnlyExpress);
  adminOnlyExpress: function(req, res, next) {
    if (req.isAuthenticated() && req.user.permissions === "admin") {
      log.logVerbose('auth.adminOnlyExpress: Admin user passed');
      next();
    } else {
      log.logVerbose('auth.adminOnlyExpress: User does not have admin permissions - user info = ' + JSON.stringify(req.user));
      res.redirect('/profile');
    }
  },


};

module.exports = auth;
