var express = require('express');
var path = require('path');
var router = express.Router();

// Get Homepage
router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../public/index.html'));
});
router.get('/login', (request, response) => {
  response.redirect('/');
});

router.post('/login', (request, response) => {
  response.send(request.body.username +request.body.password);
});

router.get('/register', (request, response) => {
  response.sendFile(path.join(__dirname,'/../public/register.html'));
});
router.get('/earth', (request, response) => {
  response.sendFile(path.join(__dirname,'/../public/images/earth.gif'));
});

router.get('*', (request, response) => {
  response.status(404).send('Page not found!!!!!!!!!!!!!!!!11')
});

module.exports = router;
