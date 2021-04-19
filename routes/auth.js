const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../bin/auth');
const log = require('../bin/logger');

router.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    log.logVerbose('Authenticated, bouncing to profile');
    res.redirect('/profile');
  } else {
    res.redirect('/');
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile'] }), function(req, res) {
  res.send('Google auth page');
});

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth?auth=failed' }), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
