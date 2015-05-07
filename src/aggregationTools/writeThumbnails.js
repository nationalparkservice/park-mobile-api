var Bluebird = require('bluebird');
var writeData = require('../github/writeData');

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

    // Filter out the array so we only have thumbnail
    var thumbnails = media.filter(function(a) {
      return a.type === 'map_thumbnail';
    });

    var findMatch = function(sites, thumbnailId) {
      for (var i = 0; i < sites.length; i++) {
        if (sites[i].map_thumbnail_image === thumbnailId) {
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
      } else {
      }
      return match ? thumbnail : null;
    });

    fulfill(thumbnails);
  });
};
