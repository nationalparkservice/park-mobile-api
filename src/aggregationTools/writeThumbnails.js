var datawrap = require('datawrap');
var Bluebird = datawrap.Bluebird;
var thumbnailSettings = require('../../thumbnailSettings');
var magickTypes = require('../../node_modules/magick-resize/types');
var geoTools = require('../geoTools.js');
var fs = require('fs');
var magickResize = require('magick-resize');
var mkdirp = require('mkdirp');
var path = require('path');
Bluebird.promisifyAll(fs);

// Offsets the marker from its lat/lon by and offset in pixels
var addOffset = function(obj) {
  obj.longitudeMarker = obj.zoom && obj.markerOffsetX ? geoTools.addPixelsToLong(obj.markerOffsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeMarker = obj.zoom && obj.markerOffsetY ? geoTools.addPixelsToLat(obj.markerOffsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  obj.longitudeImage = obj.zoom && obj.offsetX ? geoTools.addPixelsToLong(obj.offsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeImage = obj.zoom && obj.offsetY ? geoTools.addPixelsToLat(obj.offsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  return obj;
};

// Merges two objects togetger
var objMerge = function(objs) {
  var newObj = {},
    attrname;
  for (var i = 0; i < objs.length; i++) {
    for (attrname in objs[i]) {
      if (objs[i][attrname]) newObj[attrname] = objs[i][attrname].toString();
    }
  }
  newObj.icon = encodeURIComponent(newObj.icon);
  return newObj;
};

// A wrapper to make magickResize easier to work with
var magickResizeWrapper = function(args) {
  return new Bluebird(function(fulfill, reject) {
    // magickResize takes single letter args since it is a command line tool, so we just use the first letter
    var newArgs = {};
    for (var arg in args) {
      if (arg.substr(0, 1) !== '_') {
        newArgs[arg.substr(0, 1)] = args[arg];
      }
    }
    magickResize(newArgs, function(e, r) {
      if (e || !r) {
        reject(e.stack ? e : new Error(e));
      } else {
        fulfill(0);
      }
    });
  });
};

// Returns the right format for values (used to parse filenames)
var formatValue = function(value) {
  var returnValue = null;
  if (value !== false && value) {
    if (isNaN(value)) {
      returnValue = value;
    } else {
      returnValue = parseFloat(value, 10);
    }
  } else {
    returnValue = value === false ? false : null;
  }
  return returnValue;
};

// Makes a list of requests from mapbox and downloads them
var getRequests = function(thumbnailList, unitCode, config) {
  var requestList = [];
  var settings = thumbnailSettings[unitCode] || thumbnailSettings['default'];
  thumbnailList.map(function(img) {
    settings.map(function(setting) {
      var imgRequest = {
        type: setting.type,
        output: (formatValue(img[setting.field]) ? Math.random().toString(27).substr(2, 10) + '_' + formatValue(img[setting.field]) : null)
      };
      if (img[setting.field]) {
        // We are making an image for this setting!
        imgRequest._filename = img[setting.field];
        imgRequest._unitCode = unitCode;
        imgRequest.url = datawrap.fandlebars(setting.url, addOffset(objMerge([setting, magickTypes[setting.type], img, {
          'token': config.mapbox.token
        }])));
        requestList.push(imgRequest);
      }
    });
  });
  return requestList;
};

// Gets the information about the thumbnail
var getThumbnailData = function(media, sites) {
  var checkField = function(parents, field) {
    return parents && parents[field] ? parents[field] : null;
  };

  // Filter out the array so we only have thumbnail
  var thumbnails = media.filter(function(a) {
    return a.type === 'map_thumbnail';
  });

  var findMatch = function(sites, thumbnailId) {
    for (var i = 0; i < sites.length; i++) {
      if (checkField(sites[i], 'map_thumbnail_image') === thumbnailId) {
        return i;
      }
    }
    return null;
  };

  // Add the lat and lon to the thumbnail
  thumbnails = thumbnails.map(function(thumbnail) {
    var match = findMatch(sites, thumbnail.id);
    if (match) {
      thumbnail.latitude = sites[match].latitude;
      thumbnail.longitude = sites[match].longitude;
    } else {}
    return match ? thumbnail : null;
  });

  // Remove the unmatched thumbnails
  thumbnails = thumbnails.filter(function(a) {
    return !!a;
  });
  return thumbnails;
};

// We delete files if there's an error so we don't have a bunch of files lying around
var deleteFiles = function(fileList) {
  // Function that deletes a single file
  var deleteFile = function(filename) {
    return new Bluebird(function(fulfill, reject) {
      fs.unlinkAsync(filename)
        .then(fulfill)
        .catch(function(e) {
          // ENOENT means it was already deleted
          if (e.code === 'ENOENT') {
            fulfill();
          } else {
            reject(e);
          }
        });
    });
  };


  return new Bluebird(function(fulfill, reject) {
    var deleteTasks = fileList.map(function(d) {
      return {
        'name': 'Deleting the temp file for: ' + d.output,
        'task': deleteFile,
        'params': [d.output]
      };
    });
    datawrap.runList(deleteTasks)
      .then(fulfill)
      .catch(reject);
  });
};

// Writes files to the directory / server
var moveFiles = function(fileList, config) {
  var moveFile = function(oldName, newName) {
    return new Bluebird(function(fulfill, reject) {
      mkdirp(path.dirname(newName), function(error) {
        if (!error) {
          fs.renameAsync(oldName, newName)
            .then(fulfill)
            .catch(reject);
        } else {
          reject(error);
        }
      });
    });
  };
  return new Bluebird(function(fulfill, reject) {
    var filePath = config.fileLocation + '/{{_unitCode}}/media/{{_filename}}',
      taskList = fileList.map(function(file) {
        return {
          'name': 'Moving ' + file._filename,
          'task': moveFile,
          'params': [file.output, datawrap.fandlebars(filePath, file)]
        };
      });

    datawrap.runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};

module.exports = function(appJson, unitCode, config) {
  var media, sites;
  return new Bluebird(function(fulfill, reject) {
    // Loop through every site, get its lat / lon
    // generate a thumbnail from mapbox and upload it to github
    // Copy the objects
    try {
      media = JSON.parse(JSON.stringify(appJson.media));
      sites = JSON.parse(JSON.stringify(appJson.sites));
    } catch (e) {
      // If there are no sites, reject this!
      reject(e);
    }

    // Match the thumbnails to the sites
    var matchedThumbnails = getThumbnailData(media, sites);
    // Create a list of URLs to request for processing
    var imgRequests = getRequests(matchedThumbnails, unitCode, config);

    // Create a task list to go and download and generate all of the thumbnails
    var taskList = [];
    imgRequests.map(function(imgRequest) {
      taskList.push({
        'name': 'Download and resize thumbmail ' + imgRequest._filename,
        'task': magickResizeWrapper,
        'params': imgRequest
      });
    });

    // Run the task list and then either upload the files or send back an error
    datawrap.runList(taskList).then(function() {
      // Success, so upload the files to github!
      moveFiles(imgRequests, config)
        .then(function() {
          // Delete any files that we made
          deleteFiles(imgRequests).then(function() {
            // Return that there was success
            fulfill(imgRequests);
          }).catch(reject);
        }).catch(reject);
    }).catch(function(err) {
      // Error, so delete any files that we made
      deleteFiles(imgRequests).then(function() {
        // Return the original error
        reject(err);
      }).catch(reject);
    });
  });
};
