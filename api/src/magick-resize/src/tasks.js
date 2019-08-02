/* globals require */

var types = require('../types.json');
var gm = require('gm');
var fs = require('fs');
var exec = require('child_process').exec;
var download = require('./download.js');
var mkdirp = require('mkdirp');
var moveAsync = require('./moveAsync');

// Create the resize tasks
var tasks = {
  // Create Mask for a point
  createMask: function (params, temp, mainCallback) {
    var compileMask = function () {
      tasks.compositeMask(temp.resize, temp.mask, params.output, function (err) {
        if (!err) {
          fs.unlink(temp.resize, function () {
            fs.unlink(temp.mask, function () {
              if (temp.downloaded) {
                fs.unlink(temp.download, function () {
                  // END no error
                  mainCallback(null, true);
                });
              } else {
                // END no error
                mainCallback(null, true);
              }
            });
          });
        } else {
          // END with error
          mainCallback(err, false);
        }
      });
    };

    if (params.mask === 'circle') {
      // Draw a circle
      var dim = [
        (params.width / 2), (params.height / 2), (params.width < params.height ? params.width - 2 : (params.width / 2)), (params.width < params.height ? (params.height / 2) : params.height - 2)
      ];
      gm(params.width, params.height, '#000')
        .fill('#fff')
        .transparent('#000')
        .drawCircle(dim[0], dim[1], dim[2], dim[3])
        .write(
          temp.mask,
          compileMask
        );
    } else {
      // Assume a file mask
      download(params.mask, temp.mask, function () {
        compileMask();
      }, false, 2);
    }
  },
  readParams: function (args) {
    var type = this.readTypes(['initial']);
    if (args.type || args._) {
      type = this.merge(type, this.readTypes([].concat(args.type || [], args._)));
    }
    args.reqestWidth = args.reqestWidth || args.width;
    args.reqestWidth = args.reqestHeight || args.height;
    return this.merge(type, args);
  },
  readTypes: function (typeList) {
    for (var i = 0; i < typeList.length; i++) {
      if (types[typeList[i]]) {
        return types[typeList[i]];
      }
    }
    return false;
  },
  merge: function (mainObj, newObj) {
    var returnValue = {};
    for (var mainValue in mainObj) {
      returnValue[mainValue] = mainObj[mainValue];
    }
    for (var newValue in newObj) {
      returnValue[newValue] = newObj[newValue];
    }
    return returnValue;
  },
  getSize: function (path, callback) {
    gm(path)
      .size(callback);
  },
  getCrop: function (origSize, newSize) {
    var newRatio = newSize.width / newSize.height;
    var possibleWidths = [origSize.height * newRatio, origSize.width];
    var possibleHeights = [origSize.width * newRatio, origSize.height];
    var crop = {};
    if (possibleWidths[0] / possibleHeights[1] === newRatio) {
      crop.width = possibleWidths[0];
      crop.height = possibleHeights[1];
    } else {
      crop.width = possibleWidths[1];
      crop.height = possibleHeights[0];
    }
    crop.x = origSize.width < origSize.height ? 0 : (origSize.width - crop.width) / 2;
    crop.y = origSize.width > origSize.height ? 0 : (origSize.height - crop.height) / 2;

    return crop;
  },
  resizeAndCenter: function (inPath, outPath, crop, newSize, quality, callback) {
    gm(inPath)
      .crop(crop.width, crop.height, crop.x, crop.y)
      .resize(newSize.width, newSize.height)
      .quality(quality)
      .write(outPath, function (writeErr) {
        callback(writeErr);
      });
  },
  compositeMask: function (source, mask, dest, callback) {
    var gmComposite = 'gm composite -gravity north -compose in "' + source + '" "' + mask + '" "' + dest + '"';
    exec(gmComposite, callback);
  },
  runParams: function (params, temp, callback) {
    tasks.getSize(params.file, function (err, res) {
      if (err) {
        console.log('Error with the following params:');
        console.log(JSON.stringify(params, null, 2));
        // END with error
        callback(err, null);
      } else {
        tasks.resizeAndCenter(params.file, temp.resize, tasks.getCrop(res, params), params, params.quality, function (e) {
          if (e) {
            // END with error
            callback(e, null);
          } else {
            // Make the containing directory if it doesn't already exist
            mkdirp.sync(params.output.split('/').slice(0, -1).join('/'));
            if (params.mask) {
              tasks.createMask(params, temp, callback);
            } else {
              moveAsync(temp.resize, params.output, function (renameError) {
                if (renameError) {
                  callback(renameError, false);
                } else {
                  fs.unlink(temp.download, function () {
                    // END no error
                    callback(null, true);
                  });
                }
              });
            }
          }
        });
      }
    });
  }
};

module.exports = tasks;
