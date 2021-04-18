var log = require('../bin/logger');

var auth = {

  isLoggedIn: function(req) {
    return req.user && req.user.uid ? true : false;
  },

  // If not authenticated, bounce to /auth
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
  activeOnlyExpress: function(req, res, next) {
    if (!req.user.active) {
      log.logVerbose('auth.activeOnlyExpress: User not active - user info = ' + JSON.stringify(req.user));
      res.redirect('/create');
    } else {
      log.logVerbose('auth.activeOnlyExpress: Active user passed');
      next();
    }
  },

  // Accepts Express request object; if authenticated, returns username, else returns false
  usernameExpress: function(req) {
    if (req.user && req.user.playername) {
      log.logVerbose('auth.usernameExpress: Returning playername: ' + req.user.playername);
      return req.user.playername;
    } else {
      log.logVerbose('auth.usernameExpress: No playername to return');
      log.logVerbose('auth.usernameExpress: req.user = ' + JSON.stringify(req.user));
      return false;
    }
  }

};

module.exports = auth;
