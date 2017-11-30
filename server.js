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

const mysqlpool = require('./mysqlpool');

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
  response.locals.statistic_msg = request.flash('statistic_msg');
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

var roomNumber = 0; // todo use somekind of hash
var room;
var roomData;

io.sockets.on('connection',
  // We are given a wesocket object in our function
  function(socket) {
      logger.info("We have a new client: " + socket.id);

      socket.on('updateMsg', function(data) {
        var sendToRoom = data.room;
        //io.sockets.in(sendToRoom).emit('update', data);
        socket.to(sendToRoom).emit('updateMsg', data);
        logger.info("Sending update to Room: " + sendToRoom);
      });

      socket.on('doneTurnMsg', function(data) {
        var sendToRoom = data.room;
        socket.to(sendToRoom).emit('doneTurnMsg')
      })
      // Handle when user wants to start new game, need 2 users to start game
      // Should start game when second user is accepted
      socket.on('newGameMsg', function(data) {
        logger.info("Received New Game Message from client: " + socket.id);
        // if no room is available make room and join, send back to user
        if(room == null) {
          room = 'room'+roomNumber;
          logger.info("Making new Room: " + room);
          socket.join(room, (err) => {
            if (err) throw err;
          });
          logger.info("Sending Room to client: " + socket.id);
          //io.sockets.in(room).emit('room', {room: room, startGame: false});
          socket.emit('roomMsg', {room: room, playerTurn: true});

          // Update User Status to 'INROOM'
          mysqlpool.updateUserStatusInRoom(data.username, function() {
          });
          // Add room to gameDb entry
          mysqlpool.addGame(room, data.username, function() {
          });
        }
        // if there is a room available to join, send back to user, clear room for next user
        // Start game
        else{
          logger.info("Room is waiting for Player 2: " + room);
          socket.join(room, (err) => {
            if (err) throw err;
          });
          logger.info("Sending Room to client: " + socket.id);
          //io.sockets.in(room).emit('room', {room: room, startGame: true});
          socket.emit('roomMsg', {room: room, playerTurn: false});

          // Update User Status to 'INROOM'
          mysqlpool.updateUserStatusInRoom(data.username, function() {

          });
          // Add room to gameDb entry
          mysqlpool.updateGameDbPlayer2(room, data.username, function () {

          });

          // Send 'startGameMsg' to all users in room
          io.sockets.in(room).emit('startGameMsg');
          console.log("Starting game in Room : " + room);
          roomNumber++;
          room = null;
        }
      });

      // Game over message
      socket.on('gameOverMsg', function(data) {
        logger.info("Reveived Game Over Message from client: " + socket.id);
        var room = data.room;
        var winnerUsername = data.username;
        socket.to(room).emit('gameOverMsg');
        // Update User Status to 'INROOM'
        mysqlpool.incrementUserWins(winnerUsername, function() {
        });
        mysqlpool.updateUserStatusNotInRoom(winnerUsername, function() {
        });

        mysqlpool.getLoserUsernameByRoom(room, winnerUsername, function(loserUsername)
        {
          mysqlpool.incrementUserLosses(loserUsername, function() {
          });
          mysqlpool.updateUserStatusNotInRoom(loserUsername, function() {
          });
        });

        mysqlpool.setGameFinished(room, function() {
          
        })
      });

      // When socket is disconnected
      socket.on('disconnect', function() {
        logger.info("We have disconnected client: " + socket.id);
      });
  }
);
