var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var flash = require('connect-flash');
var routes = require('./routes/index');

const logger = require('./logger');
const morgan = require('morgan');

const port = 8000;

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');



app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode < 400
    }, stream: process.stderr
}));

app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode >= 400
    }, stream: process.stdout
}));

// Body Parser Middleware
app.use(bodyParser.urlencoded({extended : true}));
//app.use(express.urlencoded());

// Set Static Folder
app.use(express.static(path.join(__dirname,'public')));
app.use('/', routes);

// Connect Flash
app.use(flash());

app.use(function(request, response, next) {
  response.locals.success_msg = request.flash('success_msg');
  response.locals.error_msg = request.flash('error_msg');
  response.locals.error = request.flash('error');
  next();
});

const options = {
  key: fs.readFileSync('ssl/priv.key'),
  cert: fs.readFileSync('ssl/cert.crt')
};

https.createServer(options, app).listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  logger.info('Server is starting......');
  logger.info(`Server is listening on ${port}`);
});
