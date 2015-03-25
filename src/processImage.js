var createUuid = require('./createUuid'),
  datawrap = require('datawrap'),
  deleteImages = require('./deleteImages'),
  resizeImage = require('./resizeImage'),
  runList = datawrap.runList,
  writeImages = require('./writeImages');

module.exports = function(req, res) {
  // Default these to null if they're empty
  req.body.uuid = req.body.uuid.length > 0 ? req.body.uuid : null;
  req.body.uuidPattern = req.body.uuid.length > 0 ? req.body.uuidPattern : null;

  var field = 'userPhoto',
    file = {},
    githubSettings = {
      'account': req.body.githubAccount,
      'branch': req.body.githubBranch,
      'repo': req.body.githubRepo,
      'path': req.body.githubPath,
    },
    taskList = [],
    uuid = req.body.uuid || createUuid(req.body.uuidPattern);
  console.log(req.body);
  if (req.files[field]) {
    file = req.files[field];
    console.log('a0');

    // First we make a list of everything that needs to be resized
    req.body.types.map(function(type) {
      console.log('a6');
      taskList.push({
        'name': 'Resizing to ' + type,
        'task': resizeImage,
        'params': [file.path, uuid, type]
      });
    });

    // Then we actually resize it all
    runList(taskList, 'resize images')
      .then(function(result) {
        console.log('a1');
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
        console.log('a4');
        deleteImages(result);
        res.send('Error: ' + result.error);
      });

  } else {
    console.log('a4');
    res.send('No file uploaded');
  }
};
