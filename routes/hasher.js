const express = require('express');
const auth = require('../bin/auth');
const h3db = require('../bin/h3db');
const router = express.Router();

router.use(auth.dataEntryOnlyExpress);

router.post('/', function(req, res, next) {
  h3db.fetchHasherListBySearchTerm(req.body.search)
  .then((hashers) => {
    res.render('detail/index', {
      title: 'Hashers matching criteria',
      hashers: hashers,
    });
  });
});

router.get('/', function(req, res, next) {
  h3db.fetchHasherListByMostRecent()
  .then((hashers) => {
    res.render('detail/index', {
      title: 'Most recently edited hashers',
      hashers: hashers,
    });
  });
});

router.post('/:id', function(req, res, next) {
  let newHasher = {
    id: parseInt(req.params.id),
    real_name: req.body.real_name,
    hash_name: req.body.hash_name,
    fb_name: req.body.fb_name,
    fb_url: req.body.fb_url,
    kennel: req.body.kennel,
    notes: req.body.notes,
  };
  h3db.updateHasher(newHasher)
  .then(() => next());
});

router.all('/:id', function(req, res, next) {
  h3db.fetchHasherFullRecord(req.params.id)
  .then((hasher) => {
    res.locals.hasher = hasher || {};
  })
  .then(() => h3db.fetchKennelList())
  .then((kennelList) => {
    res.locals.kennelList = kennelList || [];
    for (let i = kennelList.length - 1; i >= 0; i--) {
      if (parseInt(kennelList[i].id) === parseInt(res.locals.hasher.kennel.id)) {
        kennelList[i].selected = true;
      }
    }
    res.render('detail/hasher', {
      awards: res.locals.hasher.awards,
      events: res.locals.hasher.events,
    });
  });
});


module.exports = router;
