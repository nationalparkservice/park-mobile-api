var Bluebird = require('bluebird');
var githubFunctions = require('./githubFunctions');

module.exports = function(localFileName, githubFileName, githubSettings, config) {
  githubSettings.filePath = githubFileName;
  return new Bluebird(function(fulfill, reject) {
    // First we read the file
    githubFunctions.readFile(localFileName)
      .catch(function(e) {
        reject('Error reading file: ' + e);
      })
      .then(function(fileData) {
        var requestOptions = githubFunctions.headers.main(githubSettings, config);
        githubFunctions.checkGithubFile(requestOptions)
          .catch(reject)
          .then(function(githubResponse) {
            var message = githubResponse.statusCode === 404 ? 'Create' : 'Update';
            message += ' ' + requestOptions.url.split('/').splice(-1, 1) + ' with ' + config.appName;
            requestOptions.method = 'put';
            requestOptions.body = JSON.stringify(githubFunctions.headers.body(githubResponse.sha, githubSettings.branch, message, fileData));
            githubFunctions.updateGithubData(requestOptions)
              .catch(reject)
              .then(fulfill);
          });
      });
  });
};
