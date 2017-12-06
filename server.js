/*jshint esversion: 6 */
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
var randomize = require('randomatic');

var mysqlpool = require('./mysqlpool');

var logger = require('./logger');
var morgan = require('morgan');

var port = 8000;

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

// Logger
app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode < 400;
    }, stream: process.stderr
}));

app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode >= 400;
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

var options = {
  key: fs.readFileSync('ssl/priv.key'),
  cert: fs.readFileSync('ssl/cert.crt')
};

// Start the Server
var server = https.createServer(options, app);

server.listen(port, function(err) {
  if (err) {
    return console.log('something bad happened', err);
  }

  logger.info('Server is starting......');
  logger.info(`Server is listening on ${port}`);
});

// WebSocket Portion
// Wortk with HTTPS server
var io = require('socket.io')(server);

var room;

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
        mysqlpool.updateUserTurn(data.username, data.turn, function () {});
        //mysqlpool.updateUserBoard(data.username, data.boardUpdate, function () {});
        //logger.info(`Updating Board for ${data.username}`);
        socket.to(sendToRoom).emit('doneTurnMsg');
        logger.info("Sending doneTurnMsg to Room: " + sendToRoom);
      });
      socket.on('updateBoardMsg', function(data) {
        mysqlpool.updateUserTurn(data.username, data.turn, function () {});
        mysqlpool.updateUserBoard(data.username, data.selectstatus, data.alreadymoved, data.istart, data.jstart, data.iend, data.jend, data.board, function () {});
        logger.info(`Updating Board for ${data.username}`);
      });
      // Handle when user wants to start new game, need 2 users to start game
      // Should start game when second user is accepted
      socket.on('newGameMsg', function(data) {
        logger.info(`Received New Game Message from ${data.username} client: ${socket.id}`);

        mysqlpool.getUserByUsername(data.username, function(user, foundUser) {

          mysqlpool.updateUserSocketId(data.username, socket.id, function() {});
          mysqlpool.updateUserStatusInRoom(data.username, function() {});

          if(user.status === "DISCONNECTED") {
            logger.info(`Disconnected User ${data.username} trying to reconnect to previous game.`);
            socket.to(user.room).emit('otherUserReCntMsg');
            socket.join(user.room, function(err) {
              if (err) throw err;
            });

            logger.info(`Sending Reconnect User Message : ${user.username} Room : ${user.room} Turn : ${user.turn} jjj`);
            socket.emit('userRecntMsg',
            { room: user.room,
              turn: user.turn,
              selectstatus : user.selectstatus,
              alreadymoved : user.alreadymoved,
              istart : user.istart,
              jstart : user.jstart,
              iend : user.iend,
              jend : user.jend,
              board: user.board});

          }
          else {
            var username = user.username;
            var socketId = socket.id;

            // if no room is available make room and join, send back to user
            if(room == null) {
              room = randomize('*',30);
              logger.info("Making new Room: " + room);
              socket.join(room, function(err) {
                if (err) throw err;
              });
              mysqlpool.updateUserRoom(username, room, function() {});
              logger.info("Sending Room to client: " + socket.id);

              var playerTurn = 1;

              mysqlpool.updateUserTurn(username, playerTurn, function() {});

              socket.emit('roomMsg', {room: room, playerTurn: playerTurn});

            }
            // if there is a room available to join, send back to user, clear room for next user
            // Start game
            else{
              logger.info("Room is waiting for Player 2: " + room);
              socket.join(room, function(err) {
                if (err) throw err;

              });
              mysqlpool.updateUserRoom(username, room, function() {});
              logger.info("Sending Room to client: " + socket.id);

              var playerTurn = 0;
              mysqlpool.updateUserTurn(username, playerTurn, function() {});

              socket.emit('roomMsg', {room: room, playerTurn: playerTurn});
              // Send 'startGameMsg' to all users in room
              io.sockets.in(room).emit('startGameMsg');
              console.log("Starting game in Room : " + room);

              room = null;
            }
          }
        });
      });

      // Game over message
      socket.on('gameOverMsg', function(data) {
        logger.info("Reveived Game Over Message from client: " + socket.id);
        var room = data.room;
        var winnerUsername = data.username;

        socket.to(room).emit('gameOverMsg'); // to loser
        // Update User Status to 'INROOM'
        mysqlpool.incrementUserWins(winnerUsername, function() {});
        mysqlpool.updateUserStatusNotInRoom(winnerUsername, function() {});
        mysqlpool.updateUserRoom(winnerUsername, "", function() {}); // empty room for user not in game
        mysqlpool.updateUserSocketId(winnerUsername, "", function() {});
        mysqlpool.updateUserTurn(winnerUsername, false, function () {});
        mysqlpool.resetUserBoard(winnerUsername, function () {});

        mysqlpool.getOtherUserInRoom(winnerUsername, room, function(loserUser, foundUser) {
          if(!foundUser) {
            logger.info(`No other User in Room : ${room} with User : ${winnerUsername}`);
          } else {
            mysqlpool.incrementUserLosses(loserUser.username, function() {});
            mysqlpool.updateUserStatusNotInRoom(loserUser.username, function() {});
            mysqlpool.updateUserRoom(loserUser.username, "", function() {}); // empty room for user not in game
            mysqlpool.updateUserSocketId(loserUser.username, "", function() {});
            mysqlpool.updateUserTurn(loserUser.username, false, function () {});
            mysqlpool.resetUserBoard(loserUser.username, function () {});
          }
        });
      });

      // When socket is disconnected
      socket.on('disconnect', function() {
        logger.info("We have disconnected client: " + socket.id);
        mysqlpool.getUserBySocketId(socket.id, function(disconnectedUser, foundUser) {
          if(foundUser){
            io.sockets.in(disconnectedUser.room).emit("userDiscMsg");
            mysqlpool.updateUserStatusDisconnected(disconnectedUser.username, function() {});
            setTimeout(checkStillDisconnected, 60*1000, disconnectedUser.username);
          }
        });
      });
  }
);

function checkStillDisconnected(username) {
  mysqlpool.getUserByUsername(username, function(disconnectedUser, foundUser) {
    if(foundUser){
      if(disconnectedUser.status === "DISCONNECTED"){
        mysqlpool.updateUserRoom(disconnectedUser.username, "", function() {});
        mysqlpool.updateUserStatusNotInRoom(disconnectedUser.username, function() {});
        mysqlpool.updateUserSocketId(disconnectedUser.username, "", function() {});
        mysqlpool.incrementUserLosses(disconnectedUser.username, function () {});
        mysqlpool.updateUserTurn(disconnectedUser.username, false, function () {});
        mysqlpool.resetUserBoard(disconnectedUser.username, function () {});

        mysqlpool.getOtherUserInRoom(disconnectedUser.username, disconnectedUser.room, function(connectedUser, foundConnectedUser) {
          if(!foundConnectedUser) {
            logger.info(`No other User in Room : ${room} with User : ${winnerUsername}`);
          } else {
            mysqlpool.incrementUserWins(connectedUser.username, function() {});
            mysqlpool.updateUserStatusNotInRoom(connectedUser.username, function() {});
            mysqlpool.updateUserSocketId(connectedUser.username, "", function() {});
            mysqlpool.updateUserRoom(connectedUser.username, "", function() {}); // empty room for user not in game
            mysqlpool.updateUserTurn(connectedUser.username, false, function () {});
            mysqlpool.resetUserBoard(connectedUser.username, function () {});

            io.sockets.in(connectedUser.room).emit('defaultWinMsg'); //Send message to still connected User "You are winner"
          }
        });
      }
    }
  });
}
