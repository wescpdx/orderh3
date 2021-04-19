const express = require('express');
const auth = require('../bin/auth');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    //loggedIn: !!req.user.key,
  });
});

module.exports = router;
