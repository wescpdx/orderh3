const express = require('express');
const auth = require('../bin/auth');
const h3db = require('../bin/h3db');
const router = express.Router();

router.use(auth.dataEntryOnlyExpress);

router.get('/', function(req, res, next) {
  res.render('detail/index', {
    //loggedIn: !!req.user.key,
  });
});

router.get('/hasher', function(req, res, next) {
  res.render('detail/index', {
    //loggedIn: !!req.user.key,
  });
});

router.get('/hasher/:id', function(req, res, next) {
  h3db.fetchHasherById(req.params.id).then((hasher) => {
    res.render('detail/hasher', {
      hasher: hasher || {},
    });
  });
});

router.post('/hasher/:id', function(req, res, next) {
  let newHasher = {
    id: parseInt(req.params.id),
    real_name: req.body.real_name,
    hash_name: req.body.hash_name,
    fb_name: req.body.fb_name,
    fb_url: req.body.fb_url,
    kennel: req.body.kennel,
    notes: req.body.notes,
  };
  h3db.updateHasher(newHasher).then((hasher) => {
    res.render('detail/hasher', {
      hasher: hasher || {},
    });
  });
});

module.exports = router;
