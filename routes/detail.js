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

router.get('/event', function(req, res, next) {
  res.render('detail/index', {
    //loggedIn: !!req.user.key,
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
  h3db.updateHasher(newHasher)
  .then(() => next());
});

router.all('/hasher/:id', function(req, res, next) {
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



router.post('/event/:id', function(req, res, next) {
  let newEvent = {
    id: parseInt(req.params.id),
    kennel: req.body.kennel,
    title: req.body.title,
    number: req.body.number,
    ev_date: req.body.ev_date,
    location: req.body.location,
    notes: req.body.notes,
  };
  h3db.updateEvent(newEvent)
  .then(() => next());
});

router.all('/event/:id', function(req, res, next) {
  h3db.fetchEventFullRecord(req.params.id)
  .then((event) => {
    res.locals.event = event || {};
    res.render('detail/event', {
      awards: event.awards,
      hashers: event.hashers,
    });
  });
});

module.exports = router;
