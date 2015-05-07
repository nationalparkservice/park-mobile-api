var Bluebird = require('bluebird'),
  datawrap = require('datawrap'),
  errorLog = require('./errorLog'),
  fs = require('fs'),
  runList = datawrap.runList,
  path = require('path'),
  writeFileToGithub = require('./github/writeFile');

module.exports = function(imageList, githubSettings, config) {
  return new Bluebird(function(fulfill, reject) {
    errorLog('w0');
    var taskList = [];
    imageList.map(function(img) {
      if (fs.existsSync(img.o)) {
        taskList.push({
          'name': 'Uploading ' + img.o + ' to github',
          'task': writeFileToGithub,
          'params': [img.o, githubSettings.relativePath + '/' + path.basename(img.o), githubSettings, config]
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
