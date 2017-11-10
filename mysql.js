var mysql = require('mysql');
const logger = require('./logger');

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
            + 'password VARCHAR(30),'
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
