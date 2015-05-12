var Bluebird = require('datawrap').Bluebird;
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
Bluebird.promisifyAll(fs);

module.exports = function(appJson, unitCode, config) {
  return new Bluebird(function(fulfill, reject) {
    var filePath = config.fileLocation + '/' + unitCode + '/app.json';
    var minFilePath = filePath.replace(/\.json$/, '.min.json');
    mkdirp(path.dirname(filePath), function(err) {
      if (err) {
        reject(err);
      } else {
        fs.writeFileAsync(filePath, JSON.stringify(appJson, null, 2))
          .then(function(r) {
            fs.writeFileAsync(minFilePath, JSON.stringify(appJson))
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
