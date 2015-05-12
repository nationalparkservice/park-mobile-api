var datawrap = require('datawrap');
var fs = require('fs');
var glob = require('glob');

datawrap.Bluebird.promisifyAll(fs);

module.exports = function(options) {
  var mediaDirectory = options.mediaDirectory,
    uuid = options.uuid;

  return new datawrap.Bluebird(function(fulfill, reject) {
    glob(uuid + '_*.*', {
      'cwd': mediaDirectory
    }, function(err, files) {
      if (err) {
        reject(err);
      } else {
        var taskList = files.map(function(file) {
          return {
            'name': 'Remove file ' + file,
            'task': fs.unlinkAsync,
            'params': [file]
          };
        });
        datawrap.runList(taskList)
          .then(fulfill)
          .catch(reject);
      }
    });
  });
};
