var Promise = require('bluebird');
var fandlebars = require('fandlebars');
var fs = require('fs');
var glob = require('glob');
var iterateTasks = require('./iterateTasks');

Promise.promisifyAll(fs);

module.exports = function (options) {
  var mediaDirectory = fandlebars(options.mediaDirectory, options);
  var uuid = options.uuid;

  return new Promise(function (fulfill, reject) {
    glob(uuid + '_*', {
      'cwd': mediaDirectory
    }, function (err, files) {
      if (err) {
        reject(err);
      } else if (files.length === 0) {
        reject('Image (' + uuid + ') does not exist');
      } else {
        var taskList = files.map(function (file) {
          return {
            'name': 'Remove file ' + file,
            'task': function (f) {
              return new Promise(function (f2, r2) {
                fs.unlinkAsync(f)
                  .then(function () {
                    f2({
                      file: f
                    });
                  })
                  .catch(r2);
              });
            },
            'params': [mediaDirectory + file]
          };
        });
        return iterateTasks(taskList, 'Delete images list')
          .then(fulfill)
          .catch(reject);
      }
    });
  });
};
