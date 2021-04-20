const express = require('express');
const auth = require('../bin/auth');
const h3db = require('../bin/h3db');
const router = express.Router();


router.use(auth.dataEntryOnlyExpress);

router.get('/', function(req, res, next) {
  res.render('reports/index', {
    //loggedIn: !!req.user.key,
  });
});

router.get('/honors-due', function(req, res, next) {
  let list = h3db.reportOnHonorsDue(3).then((list) => {
    res.render('reports/honors-due', {
      list: list || [],
    });
  });
});

module.exports = router;