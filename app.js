var express = require('express'),
  htmlRoot = __dirname + '/html/',
  imageMulter = require('./src/imageMulter'),
  port = 3001,
  processImage = require('./src/processImage');

var app = express();

app.get('/', function(req, res) {
  res.sendFile(htmlRoot + 'index.html');
});

app.post('/api/photo', [imageMulter, processImage]);

app.listen(port, function() {
  console.log('Working on port ' + port);
});
