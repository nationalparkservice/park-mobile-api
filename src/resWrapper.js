var zlib = require('zlib');
var createUuid = require('./createUuid');

var contentTypes = {
  'default': 'text/html',
  'object': 'application/json'
};

module.exports = function(req, origRes) {
  var responseUuid = createUuid(),
    newRes = {
      'error': function(error) {
        return newRes.send(error, {
          status: 500
        });
      },
      'send': function(result, options) {
        var buf, newResult = typeof result === 'object' ? JSON.stringify(result, null, 2) : result.toString(),
          status = options && options.status || '200',
          returnValue;
        if (!origRes.headersSent) {
          origRes.status(status);
          origRes.set({
            'Content-Type': contentTypes[typeof result] ? contentTypes[typeof result] : contentTypes.default,
            'X-Powered-By': 'NPMap',
            'ETag': responseUuid
          });
          // If the request headers accept gzip, return it in gzip
          if (req.headers['accept-encoding'] && req.headers['accept-encoding'].split(',').indexOf('gzip') >= 0) {
            origRes.set('Content-Encoding', 'gzip');
            buf = new Buffer(newResult, 'utf-8');
            zlib.gzip(buf, function(err, zippedResult) {
              returnValue = origRes.end(zippedResult);
            });
          } else {
            returnValue = origRes.send(newResult);
          }
        }
        return returnValue; // Return the original result, just in case there's a need for that
      }
    };

  // copy everything else over
  for (var item in origRes) {
    if (!newRes[item]) {
      newRes[item] = origRes[item];
    }
  }

  return newRes;
};
