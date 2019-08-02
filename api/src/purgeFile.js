var Promise = require('bluebird');
var EdgeGrid = require('edgegrid');
var eg;

function updateList (fileList, unitCode, config) {
  eg = eg || new EdgeGrid.apply(this, config.akamaiKey);

  return new Promise(function (fulfill, reject) {
    var urlList = fileList.map(function (file) {
      return config.cacheBaseUrl + '/' + unitCode + '/' + file;
    });
    if (urlList.length === 0) {

      fulfill('no purge');
    } else {
      // Create the Auth Object with the Payload
      eg.auth({
        body: {
          action: 'invalidate',
          objects: urlList
        },
        path: '/ccu/v2/queues/default',
        method: 'POST'
      });

      // Send the filelist to Akamai
      eg.send(function (data, response) {
        if (response && response.body) {
          response = JSON.parse(response.body);
          if (response.purgeId) {
            console.log('successful purge!', response.purgeId);
            fulfill(response.purgeId);
          } else {
            console.log('purge error', response);
            reject(new Error(response));
          }
        }
      });
    }
  });
}
module.exports = updateList;
