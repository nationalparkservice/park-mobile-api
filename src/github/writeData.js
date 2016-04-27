var Bluebird = require('bluebird'),
  githubFunctions = require('./githubFunctions');

module.exports = function(fileData, githubFileName, githubSettings, config) {
  githubSettings.filePath = githubSettings.filePath || githubFileName;
  return new Bluebird(function(fulfill, reject) {
    var requestOptions = githubFunctions.headers.main(githubSettings, config);
    githubFunctions.checkGithubFile(requestOptions)
      .catch(reject)
      .then(function(githubResponse) {
        var message = githubResponse.statusCode === 404 ? 'Create' : 'Update';
        message += ' ' + requestOptions.url.split('/').slice(-3).join('/').split('?')[0] + ' with ' + config.appName;
        requestOptions.method = 'put';
        requestOptions.body = JSON.stringify(githubFunctions.headers.body(githubResponse.sha, githubSettings.branch, message, fileData));
        githubFunctions.updateGithubData(requestOptions)
          .catch(reject)
          .then(fulfill);
      });
  });
};
