var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
var util = require('./util');
var fs = require('fs');
var hls = require('hls-server');
var config = require("./config/config.js");


var app = express();
const https = require('https');
const socket = require('socket.io');

const { Worker, isMainThread } = require('worker_threads');
const worker = new Worker('./worker.js');

console.log('isMainThread:', isMainThread);

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.connectDBString);
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
app.use('/video', require('./routes/video'));
app.use('/demo', require('./routes/demo'));
app.use('/chatting', require('./routes/chatting'));
app.use('/admin', require('./routes/admin'));

// Port setting
/*var port = 3000;
const server = app.listen(port, function () {
    console.log('server on! http://localhost:' + port);
});*/

const serverOption = {
    key: fs.readFileSync("./keys/private.pem"),
    cert: fs.readFileSync("./keys/public.pem"),
};

// HTTPS 기본 포트는 443번입니다
const server = https.createServer(serverOption, app).listen(3000, () => {
    console.log('HTTPS Server Started');
});

const io = socket(server);

io.sockets.on('connection', function (socket) {
    socket.on('newUser', function (name) {
        console.log(name + ' 님이 접속하였습니다.')

        /* 소켓에 이름 저장해두기 */
        socket.name = name
        /* 모든 소켓에게 전송 */
        io.sockets.emit('update', { type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.' })
    })

    /* 전송한 메시지 받기 */
    socket.on('message', function (data) {
        /* 받은 데이터에 누가 보냈는지 이름을 추가 */
        data.name = socket.name

        console.log(data)

        /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
        socket.broadcast.emit('update', data);
    })

    /* 접속 종료 */
    socket.on('disconnect', function () {
        console.log(socket.name + '님이 나가셨습니다.')

        /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
        socket.broadcast.emit('update', { type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.' });
    })
})

// HLS Server
new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }

            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log('File not exist');
                    return cb(null, false);
                }
                cb(null, true);
            });
        },
        getManifestStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        },
        getSegmentStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        }
    }
});
