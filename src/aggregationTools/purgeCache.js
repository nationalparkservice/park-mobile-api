var datawrap = require('datawrap'),
  fs = require('fs'),
  glob = require('glob'),
  updateList = require('../purgeFile');

module.exports = function(startDate, unitCode, config) {
  return new datawrap.Bluebird(function(fulfill, reject) {
    var updatedFiles = [];
    var updateDirectory = config.fileLocation + '/' + unitCode;
    glob('**/*', {
      'cwd': updateDirectory
    }, function(err, fileList) {
      if (err) {
        reject(err);
      } else {
        updatedFiles = fileList.filter(function(f) {
          return f.substr(-5) === '.json' || fs.statSync(updateDirectory + '/' + f).mtime >= startDate;
        });
        updateList(updatedFiles, unitCode, config)
          .then(function() {
            fulfill(updatedFiles);
          })
          .catch(reject);
      }
    });
  });
};
