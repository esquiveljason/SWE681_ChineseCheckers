var express = require('express');
var path = require('path');
var mysql = require('mysql');
var router = express.Router();
require('console.table');

const mysqlpool = require('../mysql');
const logger = require('../logger');

// Get Homepage
router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../public/login.html'));
});

router.get('/register', (request, response) => {
  response.sendFile(path.join(__dirname,'/../public/register.html'));
});

router.get('/home', (request, response) => {
  response.sendFile(path.join(__dirname, '/../public/home.html'));
});

router.get('/scores', (request, response) => {
  response.sendFile(path.join(__dirname, '/../public/scores.html'));
});

router.get('/logout', (request, response) => {
  response.redirect("/");
});

router.post('/login', (request, response) => {
  response.redirect('/home');
});

router.post('/register_page', (request, response) => {
  response.redirect('/register');
});

router.post('/register', (request, response) => {
  var firstname = request.body.firstname;
  var lastname  = request.body.lastname;
  var username  = request.body.username;
  var password  = request.body.password;

  var sql_stmt = "INSERT INTO users (firstname, lastname, username, password) values (?,?,?,?)";
  var values = [firstname, lastname, username, password];

  sql_stmt = mysql.format(sql_stmt, values);

  mysqlpool.getConnection(function(err, connection) {
    if(err) throw err;
    connection.query(sql_stmt, function (err, results, fields) {
        if (err) throw err;
        logger.info('Created new User with id ' + results.insertId);
      });
    listUsers(connection);
    connection.release();
  });



  response.redirect('/home');
  //response.send(request.body.firstname+request.body.lastname+
  //request.body.username+request.body.password+request.body.password2);
});
router.get('/earth', (request, response) => {
  response.sendFile(path.join(__dirname,'/../public/images/earth.gif'));
});

router.get('*', (request, response) => {
  response.status(404).send('Page not found!!!!!!!!!!!!!!!!11')
});


function listUsers(connection) {
  sql_stmt = "SELECT * FROM users;";

  connection.query(sql_stmt,function (err, rows){
      logger.info();
      logger.info("Artists Listing");
      logger.info();

      console.table(rows);

      logger.info("Total rows returned: " + rows.length);
  });
}
module.exports = router;
