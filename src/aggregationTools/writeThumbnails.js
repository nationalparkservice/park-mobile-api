var Bluebird = require('bluebird');
var datawrap = require('datawrap');
var thumbnailSettings = require('../../thumbnailSettings');
var magickTypes = require('../../node_modules/magick-resize/types');
var writeData = require('../github/writeData');
var geoTools = require('../geoTools.js');
var magickResize = require('magick-resize');

var addOffset = function(obj) {
  obj.longitudeMarker = obj.zoom && obj.markerOffsetX ? geoTools.addPixelsToLong(obj.markerOffsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeMarker = obj.zoom && obj.markerOffsetY ? geoTools.addPixelsToLat(obj.markerOffsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  obj.longitudeImage = obj.zoom && obj.offsetX ? geoTools.addPixelsToLong(obj.offsetX, obj.longitude, obj.zoom).toString() : obj.longitude;
  obj.latitudeImage = obj.zoom && obj.offsetY ? geoTools.addPixelsToLat(obj.offsetY, obj.latitude, obj.zoom).toString() : obj.latitude;
  return obj;
};
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

var getRequests = function(thumbnailList, unitCode, config) {
  var requestList = [];
  var settings = thumbnailSettings[unitCode] || thumbnailSettings['default'];
  thumbnailList.map(function(img) {
    settings.map(function(setting) {
      var imgRequest = {
        // _img: img,
        type: setting.type,
        output: (formatValue(img[setting.field]) ? Math.random().toString(27).substr(2,10) + '_' + formatValue(img[setting.field]) : null)
      };
      if (img[setting.field]) {
        // We are making an image for this setting!
        imgRequest._filename = img[setting.field];
        imgRequest.url = datawrap.fandlebars(setting.url, addOffset(objMerge([setting, magickTypes[setting.type], img, {
          'token': config.mapbox.token
        }])));
      requestList.push(imgRequest);
      }
    });
  });
  return requestList;
};

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
module.exports = function(config, unitCode, parkJson) {
  var media, sites;
  return new Bluebird(function(fulfill, reject) {
    // Loop through every site, get its lat / lon
    // generate a thumbnail from mapbox and upload it to github
    // Copy the objects
    try {
      media = JSON.parse(JSON.stringify(parkJson.media));
      sites = JSON.parse(JSON.stringify(parkJson.sites));
    } catch (e) {
      // If there are no sites, reject this!
      reject(e);
    }
    var matchedThumbnails = getThumbnailData(media, sites);
    var imgRequests = getRequests(matchedThumbnails, unitCode, config);

    fulfill(imgRequests);
  });
};
