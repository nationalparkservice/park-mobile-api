var Api = require('./src/api');
var allowXSS = require('./src/allowXSS');
var config = require('./config');
var express = require('express');
var port = config.port;

var app = express();
var api = new Api(config);
var apiRouter = express.Router();
allowXSS(apiRouter);

config.htmlDirectory = __dirname + '/' + config.htmlDirectory;

api.map(function (apiCall) {
  apiRouter[apiCall.method.toLowerCase()]('/api' + apiCall.path, apiCall.process);
});

app.use(apiRouter);

app.listen(port, function () {
  console.log('Working on port ' + port);
});
