var mysql = require('mysql');

// Init mysql Connection
var mysqlcon = mysql.createConnection({
  host: "localhost",
  user: "jason",
  password: "esquivel"
});


module.exports = mysqlcon;
