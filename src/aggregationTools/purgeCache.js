var Promise = require('bluebird');
var fs = require('fs');
var glob = require('glob');
var updateList = require('../purgeFile');

module.exports = function (startDate, unitCode, config) {
  return new Promise(function (fulfill, reject) {
    var updatedFiles = [];
    var updateDirectory = config.fileLocation + '/' + unitCode;
    glob('**/*', {
      'cwd': updateDirectory
    }, function (err, fileList) {
      if (err) {
        reject(err);
      } else {
        updatedFiles = fileList.filter(function (f) {
          return f.substr(-5) === '.json' || fs.statSync(updateDirectory + '/' + f).mtime >= startDate;
        });
        updateList(updatedFiles, unitCode, config)
          .then(function () {
            fulfill(updatedFiles);
          })
          .catch(reject);
      }
    });
  });
};
