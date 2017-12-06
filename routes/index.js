/*jshint esversion: 6 */
var express = require('express');
var path = require('path');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var { check, validationResult } = require('express-validator/check');
var router = express.Router();


var mysqlpool = require('../mysqlpool');
var logger = require('../logger');



// Get Homepage
router.get('/', checkAuthenticated, function (request, response) {
  //response.sendFile(path.join(__dirname, '/../public/login.html'));
  response.render('login');
});


router.get('/register', checkAuthenticated, function (request, response) {
  //response.sendFile(path.join(__dirname,'/../public/register.html'));
  response.render('register');
});

router.get('/home', ensureAuthenticated, function (request, response) {
  //response.sendFile(path.join(__dirname, '/../public/home.html'));
  response.render('home');
});

router.get('/scores', ensureAuthenticated, function(request, response) {
  // Get all user from database
  // Parse user for username, wins, losses
  // generate string with all users, wins losses
  // flash('statistic_msg', string)
  // render
  mysqlpool.getAllUsers(function(users) {
    var x;
    var userData = [];
    for (x in users) {
        userData.push({'username': users[x].username,
                      'wins': users[x].wins,
                      'losses': users[x].losses
                    });
    }
    response.render('scores', {statistic_msg: userData});
  });

});

router.get('/logout', ensureAuthenticated, function(request, response) {
  logger.info(`${request.user.username} has logged out`);
  request.logout();
  request.flash('success_msg', 'You are logged out.');
  response.redirect("/");
});

router.post('/register_page', function(request, response) {
    //response.sendFile(path.join(__dirname, '/../public/game.html'));
    response.redirect('/register');
});


passport.use( new LocalStrategy(
  function(username, password, done) {
    console.log("In Strategy");
    logger.info(`Trying to use credential \nUsername : ${username}\nPassword : ${password}`);
    mysqlpool.getUserByUsername(username, function(user, foundUser) {
      if(!foundUser) {
        return done(null, false, {message : "Invalid Username or Password. Please try again."});
      }

      // compare password with database password
      bcrypt.compare(password, user.password, function(err, isMatch) {
          if(isMatch) {
            return done(null, user);
          } else {
            return done(null, false, {message: "Invalid Username or Password. Please try again."});
          }
      });
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  mysqlpool.getUserByUsername(username, function(user, foundUser) {
    if(foundUser){
      done(null, user); //todo should be done(error,user)
    }
    else {
      logger.info('could not find user by id');
    }
  });
});

router.post('/login',
  passport.authenticate('local', { successRedirect: '/home',
                                   failureRedirect: '/',
                                   failureFlash: true })
);

router.post('/register', [
  check('firstname')
    .isLength({min: 1}).withMessage("FirstName must be entered"),
  check('lastname')
    .isLength({min: 1}).withMessage("LastName must be entered"),
  check('username')
    .isLength({min: 1}).withMessage("UserName must be entered"),
  check('password')
    .isLength({ min: 10, max: 72}).withMessage("Invalid Password, must be 10 characters"),
  check('password2')
    .custom((value, { req }) => value === req.body.password).withMessage("Must match Password")

], function(request, response) {

  var firstname = request.body.firstname;
  var lastname  = request.body.lastname;
  var username  = request.body.username;
  var password  = request.body.password;

  var errs = validationResult(request);
  if(!errs.isEmpty()) {
    console.log(errs.mapped());
    response.render('register', {
      errors: errs.mapped()});
  } else {
    mysqlpool.getUserByUsername(username, function(user, foundUser) {
      if(!foundUser){
        mysqlpool.addUser(firstname, lastname, username, password);
        request.flash('success_msg', 'You are registered and can now login');
        response.redirect('/');
      } else {
        logger.info("Registration - Username already exists");
        var err = errMsg('Username already exists');
        console.log(err);
        response.render('register', {errors: err});
      }
    });
  }

});

router.get('*', function (request, response) {
  response.status(404).send('Page not found!!!!!!!!!!!!!!!!11');
});

function errMsg(message) {
  return { err: {msg: message}};
}

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect("/");
	}
}
function checkAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		res.redirect("/home");
	} else {
		//req.flash('error_msg','You are not logged in');
		return next();
	}
}

module.exports = router;
