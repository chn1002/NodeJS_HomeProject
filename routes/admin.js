var express = require('express');
var router = express.Router();
var Contact = require('../models/Contact'); // 1

// Admin
router.get('/', function(req, res){
  res.render('admin/index');
});

module.exports = router;