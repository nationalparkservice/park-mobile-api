var datawrap = require('datawrap'),
  http = require('http'),

  getUrl = function(url) {
    return new datawrap.Bluebird(function(fulfill, reject) {
      http.get(url, fulfill)
        .on('error', reject);
    });
  },
  createPurgeTasklist = function(filePath, unitCode, config) {
    var url = datawrap.fandlebars(config.cacheResetUrl, {
      'unitCode': unitCode,
      'path': encodeURIComponent(filePath.replace(/^\//, ''))
    });
    return {
      'name': 'Update ' + filePath,
      'task': getUrl,
      'params': [url]
    };
  },
  updateList = function(fileList, unitCode, config) {
    return new datawrap.Bluebird(function(fulfill, reject) {
      datawrap.runList(fileList.map(function(filePath) {
          return createPurgeTasklist(filePath, unitCode, config);
        }))
        .then(fulfill)
        .catch(reject);
    });
  };

module.exports = updateList;
