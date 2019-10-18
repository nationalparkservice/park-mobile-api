var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
Promise.promisifyAll(fs);

var bomify = function (text) {
  // Add the utf8 Byte Order Mark
  // https://en.wikipedia.org/wiki/Byte_order_mark#UTF-8
  return '\uFEFF' + text.replace(/^\uFEFF/, '');
};

module.exports = function (appJson, unitCode, config) {
  return new Promise(function (fulfill, reject) {
    filename = config.developmentMode ? 'dev.app.json' : 'app.json'
    var filePath = config.fileLocation + '/' + unitCode + '/' + filename;
    var minFilePath = filePath.replace(/\.json$/, '.min.json');
    mkdirp(path.dirname(filePath), function (err) {
      if (err) {
        reject(err);
      } else {
        var newFile = bomify(JSON.stringify(appJson, null, 2));
        fs.readFileAsync(filePath, 'utf8').then(function (oldFile) {
          if (oldFile !== newFile) {
            fs.writeFileAsync(filePath, newFile, 'utf8').then(function (r) {
              fs.writeFileAsync(minFilePath, bomify(JSON.stringify(appJson)), 'utf8').then(function (r2) {
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
