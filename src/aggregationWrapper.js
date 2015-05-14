var aggregate = require('./aggregate'),
  config = require('../config'),
  createUuid = require('./createUuid');

var success = function(taskName, res) {
  return res.send(JSON.stringify({
    'taskName': taskName
  }, null, 2));
};

var reportError = function(error, res) {
  return res.send(JSON.stringify({
    'Error': error
  }, null, 2));
};

module.exports = function(req, res) {
  var taskName = createUuid();

  aggregate('../app.schema.json', req.body.unitCode, config, taskName, req.thumbnails)
    .then(function() {
      success(taskName, res);
    })
    .catch(function(error) {
      reportError(error, res);
    });
};
