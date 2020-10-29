var express = require('express');
var router = express.Router();

// chatting
router.get('/', function(req, res){
  res.render('chatting/index');
});

module.exports = router;