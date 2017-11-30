var mysql = require('mysql');
var bcrypt = require('bcryptjs');
const logger = require('./logger');

require('console.table');

var UserStatusEnum = {
  NOTINROOM : "NOTINROOM",
  INROOM : "INROOM"
};

var GameDBStatusEnum = {
  WAITING : "GAMEWAITING",
  ACTIVE  : "GAMEACTIVE",
  DONE    : "GAMEFINISHED"
};

// Init mysql Connection
var mysqlpool = mysql.createPool({
  connectionLimit : 20,
  host            : "localhost",
  user            : "jason",
  password        : "esquivel",
  dabase          : 'chinesecheckersdb'
});


mysqlpool.getConnection(function(err, connection){
  logger.info("Connected to mysql");
  connection.query('CREATE DATABASE IF NOT EXISTS chinesecheckersdb', function (err, results, fields) {
    if (err) throw err;
    //logger.info(results);
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
        if (err) throw err;
        // Create Users Table if it doesn't exits
        connection.query('CREATE TABLE IF NOT EXISTS users('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'firstname VARCHAR(30),'
            + 'lastname VARCHAR(30),'
            + 'username VARCHAR(30),'
            + 'password VARCHAR(80),'
            + 'wins INT NOT NULL,'
            + 'losses VARCHAR(30),'
            + 'status VARCHAR(30),'
            + 'PRIMARY KEY(id)'
            +  ')',
            function (err, results, fields) {
              if (err) throw err;
              //logger.info(results);
            }
        );
        // Create game table if it doesn't exist
        connection.query('CREATE TABLE IF NOT EXISTS games('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'room VARCHAR(30),'
            + 'player1 VARCHAR(30),'
            + 'player2 VARCHAR(30),'
            + 'status VARCHAR(30),'
            + 'PRIMARY KEY(id)'
            +  ')',
            function (err, results, fields) {
              if (err) throw err;
              //logger.info(results);
            }
        );
    });
  });
  logger.info("Releasing Connection to mysql");
  connection.release();
});

module.exports = mysqlpool;

/*
 * Debugging Statement to print all users
 */
module.exports.listUsers = function() {
  sql_stmt = "SELECT * FROM users;";
  mysqlpool.getConnection(function(err, connection) {
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;

      connection.query(sql_stmt,function (err, rows){
        if (err) throw err;
        logger.info("Total rows returned: " + rows.length);
        console.table(rows);
      });
      connection.release();
      });
  });
}

/*
 * Add user to database from registration page using firstname, lastname, username and password
 * wins and losses are initialized to zero
 */
module.exports.addUser = function(firstname, lastname, username, password) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      var winsInit = lossesInit = 0; // initialize wins losses to zero
      var statusInit = UserStatusEnum.NOTINROOM; //Initialize not in room
      var sql_stmt = "INSERT INTO users (firstname, lastname, username, password, wins, losses, status) VALUES (?,?,?,?,?,?,?)";
      var values = [firstname, lastname, username, hash, winsInit, lossesInit, statusInit];

      sql_stmt = mysql.format(sql_stmt, values);

      mysqlpool.getConnection(function(err, connection) {
        if(err) throw err;
        connection.query('USE chinesecheckersdb', function (err, results, fields) {
          if (err) throw err;

          connection.query(sql_stmt, function (err, results, fields) {
              if (err) throw err;
              logger.info('Created new User with UserName : ' + username + ' id ' + results.insertId);
          });
          connection.release();
          mysqlpool.listUsers();
        });
      });
    });
  });
}
/*
 * username - username entered by users
 * callback
 *  user - User object holding user data
 *  foundUser - boolean, true if found user in db
 */
module.exports.getUserByUsername = function(username, callback) {
  var sql_stmt = "SELECT * FROM users WHERE username = ?";
  var values = [username];
  var user;

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        // Single match was found, should never be more than 1
        if(results.length === 1) {
          user = results[0];
          logger.info(`MySQL number of matches with ${username} : ` + results.length);
          callback(user, true);
        }
        // No matches where found
        else {
          callback(null, false);
        }
      });
      connection.release();
    });
  });
}

/*
 * Get all usernames
 */
module.exports.getAllUsers = function(callback) {
  var sql_stmt = "SELECT * FROM users";

  sql_stmt = mysql.format(sql_stmt);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, allUsers, fields) {
      if(err) throw err;
        callback(allUsers);
      });
      connection.release();
    });
  });
}

/*
 * Update User Status to 'INROOM' for Username
 */
module.exports.updateUserStatusInRoom = function(username) {
  updateUserStatus(username, UserStatusEnum.INROOM);
}
/*
 * Update User Status to 'NOTINROOM' for Username
 */
module.exports.updateUserStatusNotInRoom = function(username) {
  updateUserStatus(username, UserStatusEnum.NOTINROOM);
}

/*
 * Handles sql query to update status for user
 */
function updateUserStatus(username, newUserStatus) {
  var sql_stmt = 'UPDATE users SET status = ? WHERE username = ?';
  var values = [newUserStatus, username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} to Status : ${newUserStatus}`);
      });
      connection.release();
    });
  });
}

/*
 * Handles sql query to increment wins for loser
 */
module.exports.incrementUserWins = function(username) {
  var sql_stmt = 'UPDATE users SET wins = wins + 1 WHERE username = ?';
  var values = [username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} to Increment Wins`);
      });
      connection.release();
    });
  });
}

/*
 * Handles sql query to increment wins for loser
 */
module.exports.incrementUserLosses = function(username) {
  var sql_stmt = 'UPDATE users SET losses = losses + 1 WHERE username = ?';
  var values = [username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} to Increment Losses`);
      });
      connection.release();
    });
  });
}

/*
 * Add Game entry with {room, player1(username) }
 */
module.exports.addGame = function(room, player1) {
  var sql_stmt = "INSERT INTO games (room, player1, player2, status ) VALUES (?,?,?,?)";
  var newGameStatus = GameDBStatusEnum.WAITING;
  var values = [room, player1, "", newGameStatus];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;

      connection.query(sql_stmt, function (err, results, fields) {
          if (err) throw err;
          logger.info(`Created new Game Entry Room : ${room} Player1 : ${player1} Status : ${newGameStatus}`);
      });
      connection.release();
    });
  });
}

module.exports.updateGameDbPlayer2 = function updateUserStatus(room, player2) {
  var sql_stmt = 'UPDATE games SET player2 = ?, status = ? WHERE room = ?';
  var newGameStatus = GameDBStatusEnum.ACTIVE;
  var values = [player2, newGameStatus, room];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated Game Entry Room : ${room} Player2 : ${player2} Status : ${newGameStatus}`);
      });
      connection.release();
    });
  });
}

module.exports.getLoserUsernameByRoom = function(room, winnerUsername, callback) {
  var sql_stmt = "SELECT * FROM games WHERE room = ?";
  var values = [room];
  var user;

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;

        // Single match was found, should never be more than 1
        if(results.length === 1) {
          game = results[0];
          if(game.player1 === winnerUsername) {
            callback(game.player2);
          } else if(game.player2 === winnerUsername) {
            callback(game.player1);
          }
        }
      });
      connection.release();
    });
  });
}

module.exports.setGameFinished = function updateUserStatus(room) {
  var sql_stmt = 'UPDATE games SET status = ? WHERE room = ?';
  var newGameStatus = GameDBStatusEnum.DONE;
  var values = [newGameStatus, room];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated Game Entry Room : ${room} NEW Status : ${newGameStatus}`);
      });
      connection.release();
    });
  });
}
