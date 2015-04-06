var Bluebird = require('bluebird'),
  btoa = require('btoa'),
  config = require('../config'),
  errorLog = require('./errorLog'),
  fs = Bluebird.promisifyAll(require('fs')),
  moment = require('moment'),
  momentFormat = 'MMMM Do YYYY, h:mm:ss a',
  request = require('request');

var checkGithubFile = function(requestOptions) {
  return new Bluebird(function(fulfill, reject) {

    // Request the file to see if it exists
    request.get(requestOptions, function(error, response, responseBody) {
      if (error) {
        reject(error);
      } else if (response.statusCode === 404 || response.statusCode === 200) {
        fulfill({
          createUpdate: response.statusCode === 404 ? 'Create' : 'Update',
          sha: JSON.parse(responseBody).sha
        });
      } else {
        reject('Unexpected http status on check: ' + response.statusCode);
      }
    });
  });
};

var deleteGithubData = function(requestOptions, githubSettings, githubFile) {
  return new Bluebird(function(fulfill, reject) {
    var requestBody = {
      sha: githubFile.sha,
      branch: githubSettings.branch,
      message: 'Removing ' + requestOptions.url.split('/').splice(-1, 1) + ' with ' + config.appName
    };
    requestOptions.body = JSON.stringify(requestBody);

    request.del(requestOptions, function(error, response) {
      if (error) {
        errorLog('ed0');
        reject(error);
      } else {
        if (response.statusCode === 200 || response.statusCode === 201) {
          fulfill({
            githubSettings: githubSettings,
            message: moment().format(momentFormat) + ': ' + githubSettings.relativePath + '/' + requestOptions.url.split('/').splice(-1, 1) + ' removed/pushed to GitHub',
            response: response
          });
        } else {
          errorLog(response);
          reject('Unexpected http status on delete: ' + response.statusCode);
        }
      }
    });
  });
};

var writeGithubData = function(requestOptions, githubSettings, fileData, githubFile) {
  return new Bluebird(function(fulfill, reject) {
    var requestBody = {
      sha: githubFile.sha,
      branch: githubSettings.branch,
      content: new Buffer(fileData).toString('base64'),
      message: githubFile.createUpdate + ' ' + requestOptions.url.split('/').splice(-1, 1) + ' with ' + config.appName
    };
    requestOptions.body = JSON.stringify(requestBody);

    request.put(requestOptions, function(error, response) {
      if (error) {
        errorLog('e2');
        reject(error);
      } else {
        if (response.statusCode === 200 || response.statusCode === 201) {
          fulfill({
            githubSettings: githubSettings,
            message: moment().format(momentFormat) + ': ' + githubSettings.relativePath + '/' + requestOptions.url.split('/').splice(-1, 1) + ' updated and committed/pushed to GitHub',
            response: response
          });
        } else {
          errorLog(response);
          reject('Unexpected http status on write: ' + response.statusCode);
        }
      }
    });
  });
};

var writeFile = function(localFileName, githubFileName, githubSettings) {
  return new Bluebird(function(fulfill, reject) {
    // Generate the headers
    var requestOptions = {
      url: 'https://api.github.com/repos/' + githubSettings.account + '/' + githubSettings.repo + '/contents' + githubSettings.relativePath + '/' + githubFileName,
      timeout: 30000,
      headers: {
        'User-Agent': config.appName
      }
    };

    // Add the authorization method to the requestOptions
    if (config.github.auth === 'basic') {
      requestOptions.headers.Authorization = 'Basic ' + btoa(config.github.username + ':' + config.github.password);
    } else if (config.github.auth === 'token') {
      requestOptions.qs = {
        'access_token': encodeURIComponent(config.github.accessToken)
      };
    } else {
      errorLog('e3');
      reject('Authorization method ' + config.github.auth + ' is not supported');
    }

    var uploadFile = function(fileData) {
      checkGithubFile(requestOptions)
        .then(function(githubFile) {
          if (config.github.disabled) {
            fulfill({});
          } else if (localFileName) {
            writeGithubData(requestOptions, githubSettings, fileData, githubFile)
              .then(fulfill)
              .catch(function(e) {
                errorLog('e4');
                reject(e);
              });
          } else if (!localFileName) {
            // If not filename is passed in, we delete the file from github
            deleteGithubData(requestOptions, githubSettings, githubFile)
              .then(fulfill)
              .catch(reject);
          }
        })
        .catch(function(e) {
          errorLog('e5');
          reject(e);
        });
    };


    // Read the file (using sync, because if it doesn't work, there's no reason to make a request, especially since we are rate limited)
    fs.readFileAsync(localFileName)
      .then(function(fileData) {
        uploadFile(fileData);
      })
      .catch(
        function(e) {
          errorLog('e6');
          reject(e);
        });
  });
};

module.exports = writeFile;

/* Test Script */
/*
(
  function() {
    writeFile('./test.jpg', 'test.jpg', {
      account: 'nationalparkservice',
      branch: 'gh-pages',
      repo: 'data',
      relativePath: '/places_mobile/klgo_legacy/media
    }).then(function(res) {
      errorLog(JSON.stringify(res, null, 2));
    });
  }()
);
*/
