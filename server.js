var express = require('express');
var fs = require('fs');
var app = express();
var https = require('https');
var path = require('path');
const port = 8000;



app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/earth', (request, response) => {
  response.sendFile(path.join(__dirname+'/images/earth.gif'));
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

  console.log(`server is listening on ${port}`)
});
