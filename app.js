var Api = require('./src/api');
var allowXSS = require('./src/allowXSS');
var config = require('./config');
var express = require('express');
var path = require('path');
var DatabaseApi = require('./src/db/api');
var bodyParser = require('body-parser')


// Deal with the DOI issues
require('ssl-root-cas').addFile('./secrets/DOIRootCA.crt');

var port = config.port;
var htmlDirectory = path.join(__dirname, config.htmlDirectory);

var app = express();
var api = new Api(htmlDirectory);
var databaseApi = new DatabaseApi();
var apiRouter = express.Router();
app.use(bodyParser.urlencoded({ extended: false }))

allowXSS(apiRouter);

var addtoRouter = function (router, path, apiCall) {
  var params = [];
  params.push('/' + path + apiCall.path);
  params = params.concat(apiCall.process);
  console.log(params);
  router[apiCall.method.toLowerCase()].apply(apiRouter, params);
};

api.forEach(function (apiCall) {
  addtoRouter(apiRouter, 'api', apiCall);
});

databaseApi.forEach(function (apiCall) {
  addtoRouter(apiRouter, 'db', apiCall);
});

app.use(apiRouter);

app.listen(port, function () {
  console.log('Working on port ' + port);
});
