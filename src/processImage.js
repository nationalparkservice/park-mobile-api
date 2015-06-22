var config = require('../config'),
  createUuid = require('./createUuid'),
  deleteImages = require('./deleteImages'),
  fs = require('fs'),
  purgeFile = require('./purgeFile'),
  resizeImages = require('./resizeImages'),
  resWrapper = require('./resWrapper'),

  success = function(uuid, res) {
    return res.send({
      'uuid': uuid
    });
  },

  reportError = function(error, res) {
    console.log('Error:', error);
    return res.error({
      'Error': error
    });
  },

  purgeList = function(uuid, unitCode, res, data) {
    var rootDirectory = config.fileLocation + '/' + unitCode + '/',
      fileList = data.filter(function(a) {
        return a.file;
      }).map(function(b) {
        return b.file.replace(rootDirectory, '');
      });
    purgeFile(fileList, unitCode, config)
      .then(function() {
        success(uuid, res);
      })
      .catch(function(e) {
        reportError(e, res);
      });
  };

module.exports = function(req, origRes) {
  var res = resWrapper(req, origRes);
  var field = 'userPhoto', // The body field where to find the image
    inUuid = req.params.imageId || req.body.uuid || (req.body.query && (req.body.query.uuid || req.body.query.imageId)),
    uuid = (inUuid && inUuid.trim().length > 0) ? inUuid : null,
    unitCode = req.body.unitCode || req.params.unitCode;

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
      .then(function(data) {
        purgeList(uuid, unitCode, res, data);
      })
      .catch(function(err) {
        // Delete the original file
        fs.unlink(req.files[field].path, function() {
          // Don't catch errors with deleting the file, the error is usually "not found", and we already have a more import error to return
          reportError(err, res);
        });
      });
  } else if (uuid && unitCode && (req.method === 'DELETE' || req.body.del === 'DELETE')) {
    // Delete an image
    if (req.files[field] && req.files[field].path) {
      fs.unlinkSync(req.files[field].path);
    }
    deleteImages({
        'mediaDirectory': config.fileLocation + '/{{unitCode}}/media/',
        'uuid': uuid,
        'unitCode': unitCode
      })
      .then(function(data) {
        purgeList(uuid, unitCode, res, data);
      })
      .catch(function(err) {
        reportError(err, res);
      });
  } else {
    if (req.method === 'DELETE' || req.body.del === 'DELETE') {
      if (!uuid) {
        reportError('A uuid is required to delete an image', res);
      } else if (!unitCode) {
        reportError('A unit code is required to delete an image', res);
      } else {
        reportError('Request is missing a required field', res);
      }
    } else if (!unitCode) {
      reportError('You must include a unit code in order to upload an image', res);
    } else if (!req.files[field]) {
      reportError('You must include a file to be uploaded', res);
    } else {
      reportError('Unknown error', res);
    }
  }
};
