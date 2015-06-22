var datawrap = require('datawrap'),
  magickResizeWrapper = require('./magickResizeWrapper'),
  path = require('path');

module.exports = function(options) {
  var filePath = options.file,
    fileTypes = options.fileTypes,
    mediaDirectory = options.mediaDirectory.replace(/(\/$)/g,'') + '/',
    uuid = options.uuid;

  return new datawrap.Bluebird(function(fulfill, reject) {
    var taskList = fileTypes.map(function(type, index) {
      var outputFile = mediaDirectory + uuid + '_' + type + path.extname(filePath);
      return {
        'name': 'Resize to ' + type,
        'task': magickResizeWrapper,
        'params': [{
          f: filePath,
          o: outputFile,
          t: type,
          _deleteOriginal: index === fileTypes.length - 1 // Delete the image on the last task
        }]
      };
    });

    datawrap.runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};
