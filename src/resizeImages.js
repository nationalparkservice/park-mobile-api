var datawrap = require('datawrap'),
  magickResizeWrapper = require('./magickResizeWrapper'),
  path = require('path');

module.exports = function(options) {
  var filePath = options.file,
    fileTypes = options.fileTypes,
    mediaDirectory = options.mediaDirectory,
    uuid = options.uuid;

  return new datawrap.Bluebird(function(fulfill, reject) {
    var taskList = fileTypes.map(function(type) {
      var outputFile = mediaDirectory + '/' + uuid + '_' + type + path.extname(filePath);
      return {
        'name': 'Resize to ' + type,
        'task': magickResizeWrapper,
        'params': [{
          f: filePath,
          o: outputFile,
          t: type,
          _deleteOriginal: true
        }]
      };
    });

    datawrap.runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};
