var express = require('express');
var fs = require('fs');
var app = express();
var https = require('https');
var path = require('path');

const port = 8000;
const logDir = 'log';

if(!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

var winston = require('winston');

const tsFormat = () => (new Date()).toLocaleString() ;

const logger = new (winston.Logger)({
  level: 'info',
  transports: [
    new winston.transports.Console(
      {
        timestamp: tsFormat,
      }
    ),
    new winston.transports.File(
      {
      filename: `${logDir}/server.log`,
      timestamp: tsFormat,
      json: false
      }
    )
  ]
});

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


app.use(express.static(path.join(__dirname,'/public')));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test', (request, response) => {
  response.redirect('/');
});

app.get('/earth', (request, response) => {
  response.sendFile(path.join(__dirname,'/public/images/earth.gif'));
});

app.get('*', (request, response) => {
  response.status(404).send('Page not found!!!!!!!!!!!!!!!!11')
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
