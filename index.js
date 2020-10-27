var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
var util = require('./util');
var app = express();

const {Worker, isMainThread} = require('worker_threads');
const worker = new Worker('./worker.js');
console.log('isMainThread:', isMainThread); 

var connectDBString = "mongodb://localhost:27017/chndev";

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(connectDBString);
var db = mongoose.connection;

db.once('open', function () {
    console.log('DB connected');
    worker.postMessage('message from mainThread');
});

db.on('error', function (err) {
    console.log('DB ERROR : ', err);
});

worker.on('message', (msg) => {
    console.log("Main Thead: %o", msg);
});

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(flash());
app.use(session({ secret: 'MySecret', resave: true, saveUninitialized: true }));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares
app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    res.locals.util = util;
    next();
});

// Routes
app.use('/', require('./routes/home'));
app.use('/posts', util.getPostQueryString, require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));
app.use('/files', require('./routes/files'));
app.use('/contacts', require('./routes/contacts')); 
app.use('/admin', require('./routes/admin')); 

// Port setting
var port = 3000;
app.listen(port, function () {
    console.log('server on! http://localhost:' + port);
});