var datawrap = require('datawrap');
var EdgeGrid = require('edgegrid');
var eg = new EdgeGrid({
  path: './.edgerc'
});

function createPurgePath (filePath, unitCode) {
  return 'https://www.nps.gov/npmap/projects/places-mobile/' + unitCode + '/' + filePath;
}
function updateList (fileList, unitCode, config) {
  var length = fileList.length;

  while (length--) {
    var file = fileList[length];

    file = createPurgePath(file);
  }

  return new datawrap.Bluebird(function (fulfill, reject) {
    eg.auth({
      body: {
        action: 'invalidate',
        objects: fileList
      },
      path: '/ccu/v2/queues/default',
      method: 'POST'
    });
    eg.send(function (data, response) {
      if (response && response.body) {
        response = JSON.parse(response.body);

        if (response.purgeId) {
          console.log('success');
        } else {
          console.log('error');
        }
      }
    });
  });
}

module.exports = updateList;
