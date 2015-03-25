var Bluebird = require('bluebird'),
  errorLog = require('./errorLog'),
  magickResize = require('magick-resize'),
  path = require('path');

module.exports = function(filePath, uuid, type) {
  return new Bluebird(function(fulfill, reject) {
    errorLog('b1');
    // TODO: Better temp output filenames!
    var args = {
      'f': filePath,
      't': type,
      'o': uuid + '_' + type + path.extname(filePath)
    };
    // This try only catches sync errors, like missing modules, but anything helps
    try {
      magickResize(args, function(e, r) {
        args.error = e;
        args.result = r;
        if (e) {
          errorLog('b2');
          reject(args);
        } else {
          errorLog('b3');
          fulfill(args);
        }
      });
    } catch (err) {
      errorLog('b4');
      args.error = err;
      reject(args);
    }
  });
};
