var express = require('express');
var path = require('path');
var router = express.Router();

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

module.exports = router;
