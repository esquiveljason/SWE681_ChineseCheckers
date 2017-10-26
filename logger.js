var fs = require('fs');
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

module.exports = logger
