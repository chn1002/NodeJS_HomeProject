// routes/contacts.js

var express = require('express');
var router = express.Router();

// Index
router.get('/', function(req, res){
  res.render('video/index');
});

// Index
router.get('/webrtc', function(req, res){
  res.render('video/webrtc');
});


module.exports = router;