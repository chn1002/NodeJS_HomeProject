var express = require('express');
var router = express.Router();

// Admin
router.get('/', function(req, res){
  res.render('demo/index');
});

module.exports = router;