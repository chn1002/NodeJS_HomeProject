// routes/contacts.js

var express = require('express');
var router = express.Router();

// Index
router.get('/', function(req, res){
  res.render('video/index');
});

module.exports = router;