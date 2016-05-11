var Promise = require('bluebird');
var iterateTasks = require('../iterateTasks');
var fandlebars = require('fandlebars');
var fs = require('fs');
var geoTools = require('../geoTools.js');
var magickResizeWrapper = require('../magickResizeWrapper');
var magickTypes = require('../../node_modules/magick-resize/types');
var mkdirp = require('mkdirp');
var path = require('path');
var thumbnailSettings = require('../../thumbnailSettings');

Promise.promisifyAll(fs);

var moveAsync = function (source, dest) {
  return new Promise(function (fulfill, reject) {
    var inputStream = fs.createReadStream(source);
    var outputStream = fs.createWriteStream(dest);

    inputStream.pipe(outputStream);
    outputStream.on('error', function (e) {
      reject(e);
    });
    inputStream.on('end', function () {
      fs.unlinkSync(source);
      fulfill();
    });
  });
};

// Offsets the marker from its lat/lon by and offset in pixels
var addOffset = function (obj) {
  obj.longitudeMarker = obj.zoom && obj.markerOffsetX ? geoTools.addPixelsToLong(obj.markerOffsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeMarker = obj.zoom && obj.markerOffsetY ? geoTools.addPixelsToLat(obj.markerOffsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  obj.longitudeImage = obj.zoom && obj.offsetX ? geoTools.addPixelsToLong(obj.offsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeImage = obj.zoom && obj.offsetY ? geoTools.addPixelsToLat(obj.offsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  return obj;
};

// Merges two objects togetger
var objMerge = function (objs) {
  var newObj = {};
  var attrname;
  for (var i = 0; i < objs.length; i++) {
    for (attrname in objs[i]) {
      if (objs[i][attrname]) newObj[attrname] = objs[i][attrname].toString();
    }
  }
  newObj.icon = encodeURIComponent(newObj.icon);
  return newObj;
};

// Returns the right format for values (used to parse filenames)
var formatValue = function (value) {
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
var getRequests = function (thumbnailList, unitCode, config) {
  var requestList = [];
  var settings = thumbnailSettings[unitCode] || thumbnailSettings['default'];
  config.mapbox.token = config.mapbox.token.match('/secrets/') ? fs.readFileSync(config.mapbox.token).toString().replace(/\n/g, '') : config.mapbox.token;
  thumbnailList.map(function (img) {
    settings.map(function (setting) {
      var imgRequest = {
        type: setting.type,
        output: (formatValue(img[setting.field]) ? Math.random().toString(27).substr(2, 10) + '_' + formatValue(img[setting.field]) : null)
      };
      if (img[setting.field]) {
        // We are making an image for this setting!
        imgRequest._filename = img[setting.field];
        imgRequest._unitCode = unitCode;
        imgRequest.url = fandlebars(setting.url, addOffset(objMerge([setting, magickTypes[setting.type], img, {
          'token': config.mapbox.token
        }])));
        requestList.push(imgRequest);
      }
    });
  });
  return requestList;
};

// Gets the information about the thumbnail
var getThumbnailData = function (media, sites, requestedSites) {
  // /////////////////////
  // Functions
  // Quick and dirty want to get around issues where the parent is undefined
  var checkField = function (parents, field) {
    return parents && parents[field] ? parents[field] : '';
  };

  var findMatch = function (sites, thumbnailId) {
    // Loop through all of the sites, and try to match the requested thumbnail id
    var thumbnailImage;
    for (var i = 0; i < sites.length; i++) {
      // Check if there is a thumbnail associated with this site
      thumbnailImage = checkField(sites[i], 'map_thumbnail_image');
      if (thumbnailImage.toString() === thumbnailId.toString()) {
        return i;
      }
    }
    return null;
  };
  // End function
  // ////////////////////////////

  // First we filter out the media array so we only have thumbnails
  var mediaThumbnails = media.filter(function (mediaObject) {
    return mediaObject.type === 'map_thumbnail';
  });

  // If we are requesting specific sites, only check for media matched in those
  var filteredSites = sites.filter(function (site) {
    return requestedSites === true || requestedSites.filter(function (s) {
      var id = checkField(site, 'id');
      return id.toString() === s || id === s;
    }).length > 0;
  });

  // Next we need to add the lat and lon for all of these thumbnails
  // We need to go through the app.json sites to find the matching sites
  var thumbnails = mediaThumbnails.map(function (thumbnail) {
    var match;
    match = findMatch(filteredSites, thumbnail.id);
    if (match !== null) {
      thumbnail.latitude = filteredSites[match].latitude;
      thumbnail.longitude = filteredSites[match].longitude;
    }
    return match !== null ? thumbnail : null;
  });

  // Remove any unmatched thumbnails
  thumbnails = thumbnails.filter(function (a) {
    return a !== null;
  });

  return thumbnails;
};

// We delete files if there's an error so we don't have a bunch of files lying around
var deleteFiles = function (fileList) {
  // Function that deletes a single file
  var deleteFile = function (filename) {
    return new Promise(function (fulfill, reject) {
      fs.unlinkAsync(filename)
        .then(fulfill)
        .catch(function (e) {
          // ENOENT means it was already deleted
          if (e.code === 'ENOENT') {
            fulfill();
          } else {
            reject(e);
          }
        });
    });
  };

  var deleteTasks = fileList.map(function (d) {
    return {
      'name': 'Deleting the temp file for: ' + d.output,
      'task': deleteFile,
      'params': [d.output]
    };
  });
  return iterateTasks(deleteTasks);
};

// Writes files to the directory / server
var moveFiles = function (fileList, config) {
  var moveFile = function (oldName, newName) {
    return new Promise(function (fulfill, reject) {
      mkdirp(path.dirname(newName), function (error) {
        if (!error) {
          moveAsync(oldName, newName)
            .then(fulfill)
            .catch(reject);
        } else {
          reject(error);
        }
      });
    });
  };
  var filePath = config.fileLocation + '/{{_unitCode}}/media/{{_filename}}';
  var taskList = fileList.map(function (file) {
    return {
      'name': 'Moving ' + file._filename,
      'task': moveFile,
      'params': [file.output, fandlebars(filePath, file)]
    };
  });

  return iterateTasks(taskList);
};

module.exports = function (appJson, unitCode, config, requestedSites) {
  var media;
  var sites;

  // Start the promise
  return new Promise(function (fulfill, reject) {
    // If no sites were requested just fulfill immediately
    if (!requestedSites) {
      fulfill();
    } else {
      // Otherwise we determine if it's all sites (true) or an array of sites, or just a single site (which we then put into an array)
      requestedSites = requestedSites === true || Array.isArray(requestedSites) ? requestedSites : [requestedSites];
      // We will then loop through every site, get its lat / lon
      // generate a thumbnail from mapbox and save it

      // Copy the objects out of the appJson
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
      imgRequests.map(function (imgRequest) {
        taskList.push({
          'name': 'Download and resize thumbmail ' + imgRequest._filename,
          'task': magickResizeWrapper,
          'params': imgRequest
        });
      });

      // Run the task list and then either upload the files or send back an error
      iterateTasks(taskList).then(function () {
        // Success, so upload the files to github!
        moveFiles(imgRequests, config)
          .then(function () {
            // Delete any files that we made
            deleteFiles(imgRequests).then(function () {
              // Return that there was success
              fulfill(imgRequests);
            }).catch(reject);
          }).catch(reject);
      }).catch(function (err) {
        // Error, so delete any files that we made
        deleteFiles(imgRequests).then(function () {
          // Return the original error
          reject(err);
        }).catch(reject);
      });
    }
  });
};
