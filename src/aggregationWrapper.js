var aggregate = require('./aggregate'),
  config = require('../config'),
  createUuid = require('./createUuid');

var success = function(taskName, res) {
  if (!res.headersSent) {
    return res.send(JSON.stringify({
      'taskName': taskName
    }, null, 2));
  } else {
    return false;
  }
};

var reportError = function(error, res) {
  return res.send(JSON.stringify({
    'Error': error
  }, null, 2));
};

module.exports = function(req, res) {
  var taskName = createUuid();
  if (req.query && req.query.async) {
    success(taskName, res);
  }
  var thumbnails = false; // true means all thumbnails, or you can pass in a single site id for a single site, or an array of site numbers
  if (req.params.siteId) {
    // We do a lot of parsing on this
    if (req.params.siteId.toLowerCase() === 'true' || req.params.siteId.toLowerCase() === 'all') {
      thumbnails = true;
    } else {
      thumbnails = [];
      thumbnails = req.params.siteId.split(',').forEach(function(tn) {
        if (!isNaN(tn)) {
          thumbnails.push(parseInt(tn, 10));
        }
      });
    }
  }

  aggregate('app.schema.json', (req.body && req.body.unitCode) || (req.params && req.params.siteId), config, taskName, thumbnails)
    .then(function() {
      success(taskName, res);
    })
    .catch(function(error) {
      reportError(error, res);
      throw (error);
    });
};
