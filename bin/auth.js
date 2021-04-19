const log = require('../bin/logger');
const db = require('../bin/h3db');

const auth = {

  isLoggedIn: function(req) {
    return req.user && req.user.uid ? true : false;
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
    if (!req.isAuthenticated()) {
      log.logVerbose('auth.loginOnlyExpress: Auth failed');
      res.redirect('/auth');
    } else {
      log.logVerbose('auth.loginOnlyExpress: Auth passed');
      next();
    }
  },

  // If not an active user, bounce to /create
  // router.use(auth.activeOnlyExpress);
  activeOnlyExpress: function(req, res, next) {
    if (!req.user.active) {
      log.logVerbose('auth.activeOnlyExpress: User not active - user info = ' + JSON.stringify(req.user));
      res.redirect('/create');
    } else {
      log.logVerbose('auth.activeOnlyExpress: Active user passed');
      next();
    }
  },


};

module.exports = auth;
