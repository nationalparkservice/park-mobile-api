var config = require('./buildConfig')();
var createUuid = require('./createUuid');
var aggregate = require('./aggregate');
var resWrapper = require('./resWrapper');

var success = function(taskName, result) {
  return result.send({
    'taskName': taskName
  });
};

var createThumbnailList = function(siteId) {
  // Thumbnails
  var thumbnailList = [];

  if (siteId && (siteId.toLowerCase() === 'true' || siteId.toLowerCase() === 'all')) {
    return true;
  } else if (siteId) {
    siteId.split(',').forEach(function(thumbnail) {
      if (!isNaN(thumbnail)) {
        thumbnailList.push(parseInt(thumbnail, 10));
      }
    });
    return thumbnailList;
  } else {
    return false;
  }
};

var reportError = function(error, result) {
  return result.error({
    'Error': error
  });
};

module.exports = function(request, originalResult) {
  // Wrap the result
  var newResult = resWrapper(request, originalResult);

  // Create a new task
  var taskName = createUuid();

  // Parse out the unit code from either the body or the params
  var unitCode = (request.body && request.body.unitCode) || (request.params && request.params.unitCode);

  // determine if we will be generating json (includes 'generate/json')
  var generateJson = !!request.originalUrl.match(/generate\/json/g);

  var thumbnails = createThumbnailList(request.params.siteId);

  // If the request doesn't have sync specified in its query, then we assume async, and return something to the browser right away
  if (!(request.query && request.query.sync)) {
    success(taskName, newResult);
  }

  aggregate('app.schema.json', unitCode, config, taskName, generateJson, thumbnails)
    .then(function() {
      success(taskName, newResult);
    })
    .catch(function(error) {
      reportError(error, newResult);
    });
};
