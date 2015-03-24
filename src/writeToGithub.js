var Bluebird = require('bluebird'),
  config = require('../config'),
  request = require('request');

module.exports = function(imageList, project) {
  return new Bluebird(function(fulfill, reject) {
    // TODO: not using basic auth
    var authorization = 'Basic ' + btoa(config.github.user + ':' + config.github.password);
    var options = {
      url: 'https://api.github.com/repos/nationalparkservice/data',
      timeout: 30000,
      headers: {
        'User-Agent': 'npmap-bot uploader',
        'Authorization': authorization
      }
    };
    request.get(options, function(error, response, body) {
      var commit = '{{action}} {{fileName}} for {{project}}';
      var messageFields;
      var sha = JSON.parse(body).sha;

      if (response.statusCode === 200) {
        messageFields.action = 'Updated';
      } else if (response.statusCode === 404) {
        messageFields.action = 'Created';
      } else {
        throw 'Unknown status code: ' + response.statusCode;
      }

      request.put({
        body: JSON.stringify({
          something: 'https://github.com/nationalparkservice/node-tasks/blob/master/update-fire-perimeters/update.js#L92',
          images: imageList,
          project: project,
          commit: commit,
          sha: sha
        })
      });
      reject();
    });
  });
};
