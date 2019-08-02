var aggregationWrapper = require('./aggregationWrapper');
var getStatus = require('./getStatus');
var imageMulter = require('./imageMulter');
var processImage = require('./processImage');

module.exports = function (htmlDirectory) {
  return [{
    'name': 'GET index',
    'description': 'Returns a simple HTML document that works as an example to this interface',
    'method': 'GET',
    'path': '/',
    'process': function (req, res) {
      res.sendFile(htmlDirectory + '/index.html');
    }
  }, {
    'name': 'POST image',
    'description': 'Accepts an image file, resizes it, uploads it to a server, Returns image Id',
    'method': 'POST',
    'path': '/image',
    'process': [imageMulter, processImage]
  }, {
    'name': 'PUT image',
    'description': 'Same as POST image, but updates an existing image',
    'method': 'PUT',
    'path': '/image/:imageId',
    'process': [imageMulter, processImage]
  }, {
    'name': 'DELETE image',
    'description': 'Removes an image from the server',
    'method': 'DELETE',
    'path': '/image/:imageId',
    'process': [imageMulter, processImage]
  }, {
    'name': 'PUT image',
    'description': 'Same as POST image, but updates an existing image',
    'method': 'PUT',
    'path': '/image/:unitCode/:imageId',
    'process': [imageMulter, processImage]
  }, {
    'name': 'DELETE image',
    'description': 'Removes an image from the server',
    'method': 'DELETE',
    'path': '/image/:unitCode/:imageId',
    'process': [imageMulter, processImage]
  }, {
    'name': 'GET generate/json',
    'description': 'Regenerates the app.json and meta.json for all parks',
    'method': 'GET',
    'path': '/generate/json',
    'process': [aggregationWrapper]
  }, {
    'name': 'GET generate/json/:unitCode',
    'description': 'Regenerates the app.json and meta.json for the specified unit code',
    'method': 'GET',
    'path': '/generate/json/:unitCode',
    'process': [aggregationWrapper]
  }, {
    'name': 'GET generate/thumbnails/:unitCode/:siteId',
    'description': 'Regenerates the thumbnails for the specified unit code and specific site, use "all" to generate all sites',
    'method': 'GET',
    'path': '/generate/thumbnails/:unitCode/:siteId',
    'process': [aggregationWrapper]
  }, {
    'name': 'GET generate/status/:process',
    'description': 'Gets the status of a process',
    'method': 'GET',
    'path': '/generate/status/:process',
    'process': [getStatus]
  }];
};
