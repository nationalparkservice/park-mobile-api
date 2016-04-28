var akamai = require('akamai');
var datawrap = require('datawrap');
var secrets = require('./secrets.json');

function createPurgePath (filePath, unitCode) {
  return '/npmap/projects/places-mobile/' + unitCode + '/' + filePath;
}
function updateList (fileList, unitCode, config) {
  var length = fileList.length;

  while (length--) {
    var file = fileList[length];

    file = createPurgePath(file);
  }

  return new datawrap.Bluebird(function (fulfill, reject) {
    akamai
      .purge(secrets.user, secrets.access_token, fileList, {
        action: 'invalidate'
      })
      .then(fulfill)
      .catch(reject);
  });
}

module.exports = updateList;
