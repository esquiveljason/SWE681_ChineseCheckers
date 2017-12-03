var mysql = require('mysql');
var bcrypt = require('bcryptjs');
const logger = require('./logger');
const initBoard  = "ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo";


require('console.table');

var UserStatusEnum = {
  NOTINROOM : "NOTINROOM",
  INROOM : "INROOM",
  DISCONNECTED : "DISCONNECTED"
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
            + 'losses INT NOT NULL,'
            + 'status VARCHAR(30),'
            + 'room VARCHAR(30),'
            + 'socketid VARCHAR(30),'
            + 'turn BIT,'
            + 'board CHAR(121),'
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
      var sql_stmt = "INSERT INTO users (firstname, lastname, username, password, wins, losses, status, room, socketid, turn, board) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
      var values = [firstname, lastname, username, hash, winsInit, lossesInit, statusInit, "", "", false, initBoard];

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
 * get user from db using socketid
 */
module.exports.getUserBySocketId = function(socketId, callback) {
  var sql_stmt = "SELECT * FROM users WHERE socketid = ?";
  var values = [socketId];
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
          logger.info(`MySQL number of matches with ${socketId} : ` + results.length);
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
 */
module.exports.getOtherUserInRoom = function(username, room, callback) {
  var sql_stmt = "SELECT * FROM users WHERE username != ? and room = ?";
  var values = [username, room];
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
 * Update User Status to 'DISCONNECTED' for Username
 */
module.exports.updateUserStatusDisconnected = function(username) {
  updateUserStatus(username, UserStatusEnum.DISCONNECTED);
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
 * Handles sql query update user socketid
 */
module.exports.updateUserSocketId = function(username, socketId) {
  var sql_stmt = 'UPDATE users SET socketid = ? WHERE username = ?';
  var values = [socketId, username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} Socket Id to ${socketId}`);
      });
      connection.release();
    });
  });
}

/*
 * Handles sql query update user room
 */
module.exports.updateUserRoom = function(username, room) {
  var sql_stmt = 'UPDATE users SET room = ? WHERE username = ?';
  var values = [room, username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} Room to ${room}`);
      });
      connection.release();
    });
  });
}

/*
 * Handles sql query update user turn
 */
module.exports.updateUserTurn = function(username, turn) {
  var sql_stmt = 'UPDATE users SET turn = ? WHERE username = ?';
  var values = [turn, username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} Turn to ${turn}`);
      });
      connection.release();
    });
  });
}

/*
 * Handles sql query update user turn
 */
module.exports.updateUserBoard = function(username, board) {
  var sql_stmt = 'UPDATE users SET board = ? WHERE username = ?';
  var values = [board, username];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
      if (err) throw err;
      connection.query(sql_stmt, function (err, results, fields) {
        if(err) throw err;
        logger.info(`Updated ${username} Board`);
      });
      connection.release();
    });
  });
}
