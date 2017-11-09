var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var routes = require('./routes/index');

// Init mysql Connection
var mysqlcon = mysql.createConnection({
  host: "localhost",
  user: "jason",
  password: "esquivel"
});

// Init App
var app = express();

const port = 8000;

const logger = require('./logger');
const morgan = require('morgan');

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

mysqlcon.connect(function(err) {
  if(err) throw err;
  logger.info("Connected to mysql");
});

// Body Parser Middleware
app.use(bodyParser.urlencoded({extended : true}));
//app.use(express.urlencoded());

// Set Static Folder
app.use(express.static(path.join(__dirname,'public')));
app.use('/', routes);

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
