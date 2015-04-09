var config = require('../config'),
  createUuid = require('./createUuid'),
  datawrap = require('datawrap'),
  deleteImages = require('./cleanup'),
  errorLog = require('./errorLog'),
  removeFile = require('./github/remove'),
  resizeImage = require('./resizeImage'),
  runList = datawrap.runList,
  writeImages = require('./writeImages');

module.exports = function(req, res) {
  // Default these to null if they're empty
  req.body.uuid = req.body.uuid && req.body.uuid.trim().length > 0 ? req.body.uuid : null;
  req.body.uuidPattern = req.body.uuidPattern && req.body.uuidPattern.trim().length > 0 ? req.body.uuidPattern : null;

  var field = 'userPhoto',
    file = {},
    githubSettings = {
      'account': (req.body.githubAccount || config.github.account),
      'branch': (req.body.githubBranch || config.github.branch),
      'repo': (req.body.githubRepo || config.github.repo),
      'relativePath': req.body.path,
      'auth': config.github.auth,
      'accessToken': config.github.accessToken,
      'username': config.github.username,
      'password': config.github.password
    },
    taskList = [],
    uuid = req.params.imageId || req.body.uuid || createUuid(req.body.uuidPattern);
  errorLog(req.body);

  if (req.files[field] && (req.method !== 'DELETE' || req.body.del === 'DELETE')) {
    file = req.files[field];
    errorLog('a0');

    // First we make a list of everything that needs to be resized
    [].concat(req.body.types).map(function(type) {
      errorLog('a6');
      taskList.push({
        'name': 'Resizing to ' + type,
        'task': resizeImage,
        'params': [file.path, uuid, type]
      });
    });

    // Then we actually resize it all
    runList(taskList, 'resize images')
      .then(function(result) {
        errorLog('a1');
        writeImages(result, githubSettings, config)
          .then(function() {
            deleteImages(result);
            res.send(uuid);
          })
          .catch(function(e) {
            deleteImages(result);
            res.send('Error: ' + e.splice(-1, 1));
          });
      })
      .catch(function(result) {
        errorLog('a4');
        deleteImages(result);
        res.send('Error: ' + result.splice(-1, 1).error);
      });

  } else if (req.method !== 'DELETE' || req.body.del === 'DELETE') {
    // Create a list of the probable filenames
    if (req.body.uuid) {
      [].concat(req.body.types).map(function(type) {
        ['jpg', 'png', 'JPG', 'PNG'].map(function(fileType) {
          taskList.push(req.body.uuid + '_' + type + '.' + fileType);
        });
      });

      taskList = taskList.map(function(task) {
        return {
          'name': 'Removing ' + task,
          'task': removeFile,
          'params': [githubSettings.relativePath + '/' + task, githubSettings, config]
        };
      });
      // Then we actually remove then all
      runList(taskList, 'remove images')
        .then(function() {
          res.send(uuid);
        })
        .catch(function(e) {
          res.send('Error: ' + e);
        });
    } else {
      res.send('Error: uuid required for deletion');
    }
  }
};
