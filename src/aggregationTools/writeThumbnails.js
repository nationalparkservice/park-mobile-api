var datawrap = require('datawrap'),
  fs = require('fs'),
  geoTools = require('../geoTools.js'),
  magickResizeWrapper = require('../magickResizeWrapper'),
  magickTypes = require('../../node_modules/magick-resize/types'),
  mkdirp = require('mkdirp'),
  path = require('path'),
  thumbnailSettings = require('../../thumbnailSettings');

datawrap.Bluebird.promisifyAll(fs);

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
  config.mapbox.token = fs.readFileSync(config.mapbox.token).toString();
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
var getThumbnailData = function(media, sites, requestedSites) {
  var checkField = function(parents, field) {
    return parents && parents[field] ? parents[field] : null;
  };

  // Filter out the media array so we only have thumbnails
  var thumbnails = media.filter(function(a) {
    return a.type === 'map_thumbnail';
  });

  var findMatch = function(sites, thumbnailId) {
    for (var i = 0; i < sites.length; i++) {
      // Check if there is a thumnail associated with this site
      if (checkField(sites[i], 'map_thumbnail_image') === thumbnailId) {
        // Check it we're requesting this thumbnail
        console.log('We found a match, let\'s see if it\'s in the list', requestedSites, checkField(sites[i], 'id'));
        if (requestedSites === true || requestedSites.indexOf(checkField(sites[i], 'id')) >= 0) {
          console.log('Adding ', checkField(sites[i], 'id'), 'to the list');
          return i;
        }
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
    }
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
    return new datawrap.Bluebird(function(fulfill, reject) {
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


  return new datawrap.Bluebird(function(fulfill, reject) {
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
    return new datawrap.Bluebird(function(fulfill, reject) {
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
  return new datawrap.Bluebird(function(fulfill, reject) {
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

module.exports = function(appJson, unitCode, config, requestedSites) {
  var media, sites;
  return new datawrap.Bluebird(function(fulfill, reject) {
    if (!requestedSites) {
      fulfill();
    } else {
      requestedSites = requestedSites === true || Array.isArray(requestedSites) ? requestedSites : [requestedSites];
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
      var matchedThumbnails = getThumbnailData(media, sites, requestedSites);
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
    }
  });
};
