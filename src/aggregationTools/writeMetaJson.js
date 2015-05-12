/*jshint camelcase: false */
var Bluebird = require('datawrap').Bluebird,
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  path = require('path');
fs = Bluebird.promisifyAll(fs);

module.exports = function(appJson, unitCode, config) {
  var date = new Date(),
    meta = {
      'api_version': appJson.api_version,
      'last_data_update': date.toISOString()
    };

  return new Bluebird(function(fulfill, reject) {
    var filePath = config.fileLocation + '/' + unitCode + '/meta.json';
    var minFilePath = filePath.replace(/\.json$/, '.min.json');
    mkdirp(path.dirname(filePath), function(err) {
      if (err) {
        reject(err);
      } else {
        fs.writeFileAsync(filePath, JSON.stringify(meta, null, 2))
          .then(function(r) {
            fs.writeFileAsync(minFilePath, JSON.stringify(meta))
              .then(function(r2) {
                fulfill([r, r2]);
              })
              .catch(reject);
          })
          .catch(reject);
      }
    });
  });
};
