var Api = require('./src/api'),
  config = require('./config'),
  express = require('express'),
  port = 3001;

var app = express(),
  api = new Api(config),
  apiRouter = express.Router();

api(config).map(function(apiCall) {
  apiRouter[apiCall.method]('/api' + apiCall.path, apiCall.process);
});

app.use(apiRouter);

app.listen(port, function() {
  console.log('Working on port ' + port);
});
