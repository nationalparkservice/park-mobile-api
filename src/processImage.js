var checkMountStatus = require('./checkMountStatus');
var config = require('../config');
var createUuid = require('./createUuid');
var deleteImages = require('./deleteImages');
var fs = require('fs');
var purgeFile = require('./purgeFile');
var resWrapper = require('./resWrapper');
var resizeImages = require('./resizeImages');

var success = function (uuid, res) {
  return res.send({
    'uuid': uuid
  });
};

var reportError = function (error, res) {
  console.log('Error:', error);
  return res.error({
    'Error': error
  });
};

var writeDebug = function (message, req) {
  if (config.debug) {
    console.log(new Date(), req ? req.connection.remoteAddress : '', message);
  }
};

var purgeList = function (uuid, unitCode, res, data) {
  writeDebug('purging for uuid ' + uuid + ' and unit code ' + unitCode);
  var rootDirectory = config.fileLocation + '/' + unitCode + '/';
  var fileList = data.filter(function (a) {
    return a.file;
  }).map(function (b) {
    return b.file.replace(rootDirectory, '');
  });
  purgeFile(fileList, unitCode, config)
    .then(function () {
      success(uuid, res);
    })
    .catch(function (e) {
      reportError(e, res);
    });
};

module.exports = function (req, origRes) {
  var res = resWrapper(req, origRes);
  var field = 'userPhoto'; // The body field where to find the image
  var inUuid = req.params.imageId || req.body.uuid || (req.body.query && (req.body.query.uuid || req.body.query.imageId));
  var uuid = (inUuid && inUuid.trim().length > 0) ? inUuid : null;
  var unitCode = req.body.unitCode || req.params.unitCode;

  checkMountStatus(config, function (mountE, mountR) {
    if (!mountE && mountR) {
      if (req.files[field] && unitCode && req.method !== 'DELETE' && req.body.del !== 'DELETE') {
        // Resize Image
        // We have files, a unitCode, and we're not trying to delete
        // Get the uuid or create one
        uuid = uuid || createUuid();
        writeDebug('Creating with uuid ' + uuid, req);
        resizeImages({
          'file': req.files[field].path,
          'fileTypes': Array.isArray(req.body.types) ? req.body.types : [req.body.types],
          'mediaDirectory': config.fileLocation + '/' + unitCode + '/media/',
          'uuid': uuid
        })
          .then(function (data) {
            purgeList(uuid, unitCode, res, data);
          })
          .catch(function (err) {
            // Delete the original file
            fs.unlink(req.files[field].path, function () {
              // Don't catch errors with deleting the file, the error is usually "not found", and we already have a more import error to return
              reportError(err, res);
            });
          });
      } else if (uuid && unitCode && (req.method === 'DELETE' || req.body.del === 'DELETE')) {
        writeDebug('Deleting with uuid ' + uuid, req);
        // Delete an image
        if (req.files[field] && req.files[field].path) {
          fs.unlinkSync(req.files[field].path);
        }
        deleteImages({
          'mediaDirectory': config.fileLocation + '/{{unitCode}}/media/',
          'uuid': uuid,
          'unitCode': unitCode
        })
          .then(function (data) {
            purgeList(uuid, unitCode, res, data);
          })
          .catch(function (err) {
            reportError(err, res);
          });
      } else {
        writeDebug('There is an error ' + uuid, req);
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
    } else {
      reportError('Error accessing mounted drive: ' + mountE, res);
    }
  });
};
