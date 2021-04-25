const express = require('express');
const auth = require('../../bin/auth');
const router = express.Router();

router.use(auth.dataEntryOnlyApi);

/* GET home page. */
router.get('/', function(req, res, next) {
  let content = {
    test: "This is a test",
    user: req.user,
  };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(content));
});

module.exports = router;
