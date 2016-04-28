var Bluebird = require('bluebird'),
  btoa = require('btoa'),
  fs = Bluebird.promisifyAll(require('fs')),
  moment = require('moment'),
  momentFormat = 'MMMM Do YYYY, h:mm:ss a',
  request = require('request');

module.exports = {
  checkGithubFile: function(requestOptions) {
    return new Bluebird(function(fulfill, reject) {
      // Request the file to see if it exists
      request.get(requestOptions, function(error, response, responseBody) {
        if (error) {
          reject(error);
        } else if (response.statusCode === 404 || response.statusCode === 200) {
          fulfill({
            statusCode: response.statusCode,
            sha: JSON.parse(responseBody).sha
          });
        } else {
          reject('Unexpected http status on check: ' + response.statusCode + '   ' +  JSON.stringify(response, null, 2));
        }
      });
    });
  },
  headers: {
    main: function(githubSettings, config) {
      return {
        url: 'https://api.github.com/repos/' + githubSettings.account + '/' + githubSettings.repo + '/contents/' + githubSettings.filePath + '?ref=' + githubSettings.branch,
        timeout: 30000,
        headers: {
          'User-Agent': config.appName,
          'Authorization': githubSettings.auth.toLowerCase() === 'basic' ? ('Basic ' + btoa(githubSettings.username + ':' + githubSettings.password)) : undefined
        },
        qs: githubSettings.auth.toLowerCase() === 'token' ? {
          'access_token': encodeURIComponent(githubSettings.accessToken)
        } : undefined
      };
    },
    body: function(sha, branch, message, fileData) {
      return {
        sha: sha,
        branch: branch,
        content: fileData ? new Buffer(fileData).toString('base64') : null,
        message: message
      };
    }
  },
  readFile: function(filename, encoding) {
    return new Bluebird(function(fulfill, reject) {
      fs.readFileAsync(filename, encoding)
        .catch(reject)
        .then(fulfill);
    });
  },
  updateGithubData: function(requestOptions) {
    return new Bluebird(function(fulfill, reject) {
      request[requestOptions.method](requestOptions, function(error, response) {
        if (error) {
          reject(error);
        } else {
          if (response.statusCode === 200 || response.statusCode === 201) {
            fulfill({
              message: moment().format(momentFormat) + ': ' + requestOptions.url.split('/').splice(-1, 1) + ' updated and committed/pushed to GitHub',
              response: response
            });
          } else {
            reject('Unexpected http status on write: ' + response.statusCode + '   ' +  JSON.stringify(response, null, 2));
          }
        }
      });
    });
  }
};
