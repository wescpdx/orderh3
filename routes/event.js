const express = require("express");
const auth = require("../bin/auth");
const h3db = require("../bin/h3db");
const router = express.Router();

router.use(auth.dataEntryOnlyExpress);

router.post("/", function(req, res, next) {
  h3db.fetchEventListBySearchTerm(req.body.search)
  .then((events) => {
    res.render("event/index", {
      title: "Events matching criteria",
      events: events,
    });
  });
});

router.get("/", function(req, res, next) {
  h3db.fetchEventListByMostRecent()
  .then((events) => {
    res.render("event/index", {
      title: "Most recently edited events",
      events: events,
    });
  });
});

router.post("/new", function(req, res, next) {
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

router.all("/new", function(req, res, next) {
  res.render("event/new", {
    mode: "Create",
    event: {},
  });
});

router.post("/:id", function(req, res, next) {
  const newEvent = {
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

router.all("/:id", function(req, res, next) {
  h3db.fetchEventFullRecord(req.params.id)
  .then((event) => {
    res.locals.event = event || {};
    res.render("event/edit", {
      awards: event.awards,
      hashers: event.hashers,
    });
  });
});

router.post("/:id/add", function(req, res, next) {
  const listOfHashers = function(postData) {
    let list = [];
    let keys = Object.keys(postData).filter((key) => key.includes("hasher"));
    for (const key of keys) {
      list.push(parseInt(key.replace("hasher-", "")));
    }
    return list;
  };

  const listOfAwardDeliveries = function(postData, eventId) {
    let list = [];
    let keys = Object.keys(postData).filter((key) => key.includes("hasher"));
    for (const key of keys) {
      let link = {
        honor: parseInt(key.match(/honor-([^-]+)-/)[1]),
        hasher: parseInt(key.match(/hasher-([^-]+)-/)[1]),
        event: parseInt(eventId),
      };
      list.push(link);
    }
    return list;
  };

  if (req.body.form === "add_hasher") {
    const linkData = {
      event: parseInt(req.params.id),
      hasher: parseInt(req.body.hasher),
      hare: !!req.body.hare,
      jedi: !!req.body.jedi,
    };
    h3db.addHasherToEvent(linkData)
    .then(next());
  } else if (req.body.form === "remove_hasher") {
    h3db.removeHashersFromEvent(listOfHashers(req.body), parseInt(req.params.id))
    .then(next());
  } else if (req.body.form === "add_award") {
    h3db.addAwardDeliveryAll(listOfAwardDeliveries(req.body, parseInt(req.params.id)))
    .then(next());
  } else {
    next();
  }
});

router.all("/:id/add", function(req, res, next) {
  h3db.fetchEventFullRecord(req.params.id)
  .then((event) => {
    res.locals.event = event || {};
    res.locals.hashers = event.hashers || [];
    return h3db.fetchHonorsDueByEvent(req.params.id);
  })
  .then((awards) => {
    res.locals.awards = awards || [];
    return h3db.fetchHasherListExceptEvent(req.params.id);
  })
  .then((unhashers) => {
    res.render("event/add", {
      unhashers: unhashers || [],
    });
  });
});

module.exports = router;
