var datawrap = require('datawrap'),
  fs = require('fs'),
  glob = require('glob'),
  http = require('http');
// moment =require('moment');

var getUrl = function(url) {
  return new datawrap.Bluebird(function(fulfill, reject) {
    http.get(url, fulfill)
      .on('error', reject);
  });
};

module.exports = function(startDate, unitCode, config) {
  var createPurgeTasklist = function(filePath) {
    var url = datawrap.fandlebars(config.cacheResetUrl, {
      'unitCode': unitCode,
      'path': encodeURIComponent(filePath.replace(/^\//, ''))
    });
    return {
      'name': 'Update ' + filePath,
      'task': getUrl,
      'params': [url]
    };
  };

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
          return fs.statSync(updateDirectory + '/' + f).mtime >= startDate;
        });
        datawrap.runList(updatedFiles.map(createPurgeTasklist))
          .then(function() {
            fulfill(updatedFiles);
          })
          .catch(reject);
      }
    });
  });
};
