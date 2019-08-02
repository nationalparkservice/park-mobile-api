var iterateTasks = require('./iterateTasks');
var magickResizeWrapper = require('./magickResizeWrapper');
var path = require('path');

module.exports = function (options) {
  var filePath = options.file;
  var fileTypes = options.fileTypes;
  var mediaDirectory = options.mediaDirectory.replace(/(\/$)/g, '') + '/';
  var uuid = options.uuid;

  var taskList = fileTypes.map(function (type, index) {
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

  return iterateTasks(taskList);
};
