var datawrap = require('datawrap');
var fs = require('fs');
var glob = require('glob');

datawrap.Bluebird.promisifyAll(fs);

module.exports = function(options) {
  var mediaDirectory = datawrap.fandlebars(options.mediaDirectory, options),
    uuid = options.uuid;

  return new datawrap.Bluebird(function(fulfill, reject) {
    glob(uuid + '_*.*', {
      'cwd': mediaDirectory
    }, function(err, files) {
      if (err) {
        reject(err);
      } else if (files.length === 0) {
        reject('Image (' + uuid + ') does not exist');
      } else {
        var taskList = files.map(function(file) {
          return {
            'name': 'Remove file ' + file,
            'task': fs.unlinkAsync,
            'params': [mediaDirectory + file]
          };
        });
        datawrap.runList(taskList)
          .then(fulfill)
          .catch(reject);
      }
    });
  });
};
