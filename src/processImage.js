var config = require('../config'),
  createUuid = require('./createUuid'),
  datawrap = require('datawrap'),
  deleteImages = require('./cleanup'),
  errorLog = require('./errorLog'),
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
      'relativePath': req.body.path
    },
    taskList = [],
    uuid = req.params.imageId || req.body.uuid || createUuid(req.body.uuidPattern);
  errorLog(req.body);
  if (req.files[field]) {
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
        writeImages(result, githubSettings)
          .then(function() {
            deleteImages(result);
            res.send('good');
          })
          .catch(function(e) {
            deleteImages(result);
            res.send('Error: ' + e);
          });
      })
      .catch(function(result) {
        errorLog('a4');
        deleteImages(result);
        res.send('Error: ' + result.splice(-1,1).error);
      });

  } else {
    errorLog('a4');
    res.send('No file uploaded');
  }
};
