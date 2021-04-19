const express = require('express');
const auth = require('../bin/auth');
const log = require('../bin/logger');
const router = express.Router();

router.use(auth.loginOnlyExpress);

/* GET home page. */
router.get('/', function(req, res, next) {
  log.logVerbose(`GET router for /profile`);
  res.render('profile', {
    user: req.user || {},
  });
});

router.post('/', function(req, res, next) {
  log.logVerbose(`POST router for /profile`);
  let newUser = { ...req.user };
  newUser.name = req.body.name;
  newUser.email = req.body.email;
  auth.updateUserData(newUser).then((usr) => {
    req.session.passport.user.name = usr.name;
    req.session.passport.user.email = usr.email;
    req.user = usr;
    res.render('profile', {
      user: req.user,
    });
  });
});

module.exports = router;
