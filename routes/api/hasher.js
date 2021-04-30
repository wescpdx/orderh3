const express = require('express');
const auth = require('../../bin/auth');
const h3db = require('../../bin/h3db');
const router = express.Router();

router.use(auth.dataEntryOnlyApi);


router.get('/:id', function(req, res, next) {
  h3db.fetchHasherFullRecord(req.params.id)
  .then((hasher) => {
    let content = {
      hasher: hasher,
    };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(content));
  });
});

router.post('/:id', function(req, res, next) {
  h3db.updateHasher(req.body)
  .then((apiResponse) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(apiResponse));
  });
});

module.exports = router;
