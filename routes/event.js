const express = require('express');
const auth = require('../bin/auth');
const h3db = require('../bin/h3db');
const router = express.Router();

router.use(auth.dataEntryOnlyExpress);

router.post('/', function(req, res, next) {
  h3db.fetchEventListBySearchTerm(req.body.search)
  .then((events) => {
    res.render('event/index', {
      title: 'Events matching criteria',
      events: events,
    });
  });
});

router.get('/', function(req, res, next) {
  h3db.fetchEventListByMostRecent()
  .then((events) => {
    res.render('event/index', {
      title: 'Most recently edited events',
      events: events,
    });
  });
});

router.post('/new', function(req, res, next) {
  let newEvent = {
    id: parseInt(req.params.id),
    kennel: req.body.kennel,
    title: req.body.title,
    number: req.body.number,
    ev_date: req.body.ev_date,
    location: req.body.location,
    notes: req.body.notes,
  };
  h3db.createEvent(newEvent)
  .then(() => next());
});

router.all('/new', function(req, res, next) {
  res.render('event/new', {
    mode: "Create",
    event: {},
  });
});

router.post('/:id', function(req, res, next) {
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

router.all('/:id', function(req, res, next) {
  h3db.fetchEventFullRecord(req.params.id)
  .then((event) => {
    res.locals.event = event || {};
    res.render('event/edit', {
      awards: event.awards,
      hashers: event.hashers,
    });
  });
});

module.exports = router;
