var Bluebird = require('bluebird'),
  datawrap = require('datawrap'),
  errorLog = require('./errorLog'),
  fs = require('fs'),
  runList = datawrap.runList,
  path = require('path'),
  writeToGithub = require('./writeToGithub');

module.exports = function(imageList, githubSettings) {
  return new Bluebird(function(fulfill, reject) {
    errorLog('w0');
    var taskList = [];
    imageList.map(function(img) {
      if (fs.existsSync(img.o)) {
        taskList.push({
          'name': 'Uploading ' + img.o + ' to github',
          'task': writeToGithub,
          'params': [img.o, path.basename(img.o), githubSettings]
        });
      } else {
        reject('File ' + img.o + ' not found');
      }
    });

    runList(taskList, 'Upload to GitHub')
      .then(fulfill)
      .catch(reject);
  });
};
