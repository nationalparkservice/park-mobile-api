var Promise = require('bluebird');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
fs = Promise.promisifyAll(fs);

module.exports = function (appJson, unitCode, config, appJsonWrites) {
  var date = new Date();
  var meta = {
    'api_version': appJson.api_version,
    'last_data_update': date.toISOString()
  };

  return new Promise(function (fulfill, reject) {
    filename = config.developmentMode ? 'dev.meta.json' : 'meta.json'
    var filePath = config.fileLocation + '/' + unitCode + '/meta.json';
    var minFilePath = filePath.replace(/\.json$/, '.min.json');
    mkdirp(path.dirname(filePath), function (err) {
      if (err) {
        reject(err);
      } else {
        var newData = JSON.stringify(meta, null, 2);
        fs.readFileAsync(filePath, 'utf8').then(function (oldData) {
          if (appJsonWrites.length > 0 && oldData !== newData) {
            fs.writeFileAsync(filePath, newData, 'utf8').then(function (r) {
              fs.writeFileAsync(minFilePath, JSON.stringify(meta), 'utf8').then(function (r2) {
                fulfill([r, r2]);
              }).catch(reject);
            }).catch(reject);
          } else {
            fulfill([]);
          }
        }).catch(reject);
      }
    });
  });
};
