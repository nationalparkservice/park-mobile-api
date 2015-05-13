var config = require('../config'),
  createUuid = require('./createUuid'),
  deleteImages = require('./deleteImages'),
  fs = require('fs'),
  resizeImages = require('./resizeImages');

var success = function(uuid, res) {
  return res.send(JSON.stringify({
    'uuid': uuid
  }, null, 2));
};
var reportError = function(error, res) {
  return res.send(JSON.stringify({
    'Error': error
  }, null, 2));
};

module.exports = function(req, res) {
  var field = 'userPhoto', // The body field where to find the image
    uuid = (req.body.uuid && req.body.uuid.trim().length > 0) ? req.body.uuid : null,
    unitCode = req.body.unitCode;

  if (req.files[field] && unitCode && req.method !== 'DELETE' && req.body.del !== 'DELETE') {
    // Resize Image
    // We have files, a unitCode, and we're not trying to delete
    // Get the uuid or create one
    uuid = uuid || createUuid();
    resizeImages({
        'file': req.files[field].path,
        'fileTypes': Array.isArray(req.body.types) ? req.body.types : [req.body.types],
        'mediaDirectory': config.fileLocation + '/' + unitCode + '/media/',
        'uuid': uuid
      })
      .then(function() {
        success(uuid, res);
      })
      .catch(function(err) {
        // Delete the original file
        fs.unlink(req.files[field].path, function() {
          // Don't catch errors with deleting the file, the error is usually "not found", and we already have a more import error to return
          reportError(err, res);
        });
      });
  } else if (req.body.uuid && (req.method === 'DELETE' || req.body.del === 'DELETE')) {
    // Delete an image
    if (req.files[field] && req.files[field].path) {
      fs.unlinkSync(req.files[field].path);
    }
    deleteImages({
        'mediaDirectory': config.fileLocation + '/' + unitCode + '/media/',
        'uuid': uuid
      })
      .then(function() {
        success(uuid, res);
      })
      .catch(function(err) {
        reportError(err, res);
      });
  } else {
    if (req.method === 'DELETE' || req.body.del === 'DELETE') {
      reportError('A uuid is required to delete an image');
    } else if (!unitCode) {
      reportError('You must include a unit code in order to upload an image');
    } else if (!req.files[field]) {
      reportError('You must include a file to be uploaded');
    } else {
      reportError('Unknown error');
    }
  }
};
