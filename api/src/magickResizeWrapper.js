var Promise = require('bluebird');
var fs = require('fs');
var magickResize = require('magick-resize');
var mkdirp = require('mkdirp');
var path = require('path');

Promise.promisifyAll(fs);

// A wrapper to make magickResize easier to work with
module.exports = function (args) {
  return new Promise(function (fulfill, reject) {
    // magickResize takes single letter args since it is a command line tool, so we just use the first letter
    var newArgs = {};
    for (var arg in args) {
      if (arg.substr(0, 1) !== '_') {
        newArgs[arg.substr(0, 1)] = args[arg];
      }
    }
    mkdirp(path.dirname(newArgs.o), function (error) {
      if (error) {
        reject(error);
      } else {
        magickResize(newArgs, function (e, r) {
          if (e || !r) {
            reject(e.stack ? e : new Error(e));
          } else {
            if (args._deleteOriginal) {
              fs.unlinkAsync(newArgs.f).then(function () {
                fulfill({
                  result: r,
                  file: args.o
                });
              }).catch(function (e) {
                reject(e);
              });
            } else {
              fulfill({
                result: r,
                file: args.o
              });
            }
          }
        });
      }
    });
  });
};
