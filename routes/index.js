var express = require('express');
var path = require('path');
var mysql = require('mysql');

const { check, validationResult } = require('express-validator/check');
var router = express.Router();


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
    mysqlpool.addUser(firstname, lastname, username, password);
    response.redirect('/');
  }

});
router.get('/earth', (request, response) => {
  response.sendFile(path.join(__dirname,'/../public/images/earth.gif'));
});

router.get('*', (request, response) => {
  response.status(404).send('Page not found!!!!!!!!!!!!!!!!11')
});

module.exports = router;
