var Bluebird = require('bluebird');
var githubFunctions = require('./githubFunctions');

module.exports = function(githubFileName, githubSettings, config) {
  githubSettings.filePath = githubFileName;
  return new Bluebird(function(fulfill, reject) {
    var requestOptions = githubFunctions.headers.main(githubSettings, config);
    githubFunctions.checkGithubFile(requestOptions)
      .catch(reject)
      .then(function(githubResponse) {
        var message = 'Delete ' + requestOptions.url.split('/').slice(-3).join('/').split('?')[0] + ' with ' + config.appName;
        if (githubResponse.statusCode === 404) {
          fulfill({
            'status': githubResponse.statusCode
          });
        } else {
          requestOptions.method = 'del';
          requestOptions.body = JSON.stringify(githubFunctions.headers.body(githubResponse.sha, githubSettings.branch, message, null));
          githubFunctions.updateGithubData(requestOptions)
            .catch(reject)
            .then(fulfill);
        }
      });
  });
};
