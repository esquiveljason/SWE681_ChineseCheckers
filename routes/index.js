var express = require('express');
var path = require('path');
var mysql = require('mysql');
var bcrypt = require('bcryptjs');

const { check, validationResult } = require('express-validator/check');
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

router.post('/register', [
  check('firstname')
    .isLength({min: 1}).withMessage("FirstName must be entered"),
  check('lastname')
    .isLength({min: 1}).withMessage("LastName must be entered"),
  check('username')
    .isLength({min: 1}).withMessage("UserName must be entered"),
  check('password')
    .isLength({ min: 10, max: 72}).withMessage("Passwords must be between 10 and 72 characters"),
  check('password2')
    .custom((value, { req }) => value === req.body.password).withMessage("Must match Password")

], (request, response) => {

  var firstname = request.body.firstname;
  var lastname  = request.body.lastname;
  var username  = request.body.username;
  var password  = request.body.password;

  const errors = validationResult(request);

  if(!errors.isEmpty()) {
    console.log(errors.mapped());
    response.redirect('/register');
  } else {
    addUser(firstname, lastname, username, password);
    response.redirect('/');
  }

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

function addUser(firstname, lastname, username, password) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      var sql_stmt = "INSERT INTO users (firstname, lastname, username, password) values (?,?,?,?)";
      var values = [firstname, lastname, username, hash];

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
    });
  });

}



module.exports = router;
