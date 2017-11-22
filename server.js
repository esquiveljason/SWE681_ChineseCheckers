var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var routes = require('./routes/index');

const logger = require('./logger');
const morgan = require('morgan');

const port = 8000;

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

// Logger
app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode < 400
    }, stream: process.stderr
}));

app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode >= 400
    }, stream: process.stdout
}));

// Body Parser Middleware
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname,'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Connect Flash
app.use(flash());

// Passport Init
app.use(passport.initialize());
app.use(passport.session());



app.use(function(request, response, next) {
  response.locals.success_msg = request.flash('success_msg');
  response.locals.error_msg = request.flash('error_msg');
  response.locals.error = request.flash('error');
  response.locals.user = request.user || null;
  next();
});

app.use('/', routes);

const options = {
  key: fs.readFileSync('ssl/priv.key'),
  cert: fs.readFileSync('ssl/cert.crt')
};

// Start the Server
var server = https.createServer(options, app);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  logger.info('Server is starting......');
  logger.info(`Server is listening on ${port}`);
});

// WebSocket Portion
// Wortk with HTTPS server
var io = require('socket.io')(server);

io.sockets.on('connection',
  // We are given a wesocket object in our function
  function(socket) {
      logger.info("We have a new client: " + socket.id);

      socket.on('update', function(data) {
        socket.broadcast.emit('update', data);
      });

      // When socket is disconnected
      socket.on('disconnect', function() {
        console.log("We have disconnected client: " + socket.id);
      });
  }
);
