var mysql = require('mysql');
var bcrypt = require('bcryptjs');
const logger = require('./logger');

require('console.table');

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
    logger.info(results);
    connection.query('USE chinesecheckersdb', function (err, results, fields) {
        if (err) throw err;
        logger.info(results);
        connection.query('CREATE TABLE IF NOT EXISTS users('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'firstname VARCHAR(30),'
            + 'lastname VARCHAR(30),'
            + 'username VARCHAR(30),'
            + 'password VARCHAR(80),'
            + 'PRIMARY KEY(id)'
            +  ')',
            function (err, results, fields) {
              if (err) throw err;
              logger.info(results);
            }
        );
    });
  });
  logger.info("Releasing Connection to mysql");
  connection.release();
});

module.exports = mysqlpool;

module.exports.listUsers = function(connection) {
  sql_stmt = "SELECT * FROM users;";
  mysqlpool.getConnection(function(err, connection) {
    connection.query(sql_stmt,function (err, rows){
      if (err) throw err;
      logger.info("Total rows returned: " + rows.length);
      console.table(rows);
    });
    connection.release();
  });
}

module.exports.addUser = function(firstname, lastname, username, password) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      var sql_stmt = "INSERT INTO users (firstname, lastname, username, password) values (?,?,?,?)";
      var values = [firstname, lastname, username, hash];

      sql_stmt = mysql.format(sql_stmt, values);

      mysqlpool.getConnection(function(err, connection) {
        if(err) throw err;
        connection.query(sql_stmt, function (err, results, fields) {
            if (err) throw err;
            logger.info('Created new User with UserName : ' + username + ' id ' + results.insertId);
        });
        connection.release();
        mysqlpool.listUsers();
      });
    });
  });
}
