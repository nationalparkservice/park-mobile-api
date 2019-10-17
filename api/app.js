var Api = require('./src/api');
var allowXSS = require('./src/allowXSS');
var express = require('express');
var port = process.env.API_PORT;

var app = express();
var api = new Api();
var apiRouter = express.Router();
allowXSS(apiRouter);

api.map(function(apiCall) {
  apiRouter[apiCall.method.toLowerCase()]('/api' + apiCall.path, apiCall.process);
});

app.use(apiRouter);

app.listen(port, function() {
  console.log('Working on port ' + port);
});
