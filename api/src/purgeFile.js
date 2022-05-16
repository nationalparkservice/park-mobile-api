var Promise = require('bluebird');
var EdgeGrid = require('edgegrid');
var request = require('request-promise');
var querystring = require("querystring");
var eg;

var purgeUrl = 'https://cms.nps.gov/purge/CloudFrontPurge.cfm?';

function updateList(fileList, unitCode, config) {
  eg = eg || new EdgeGrid(
    config.akamaiKey[0],
    config.akamaiKey[1],
    config.akamaiKey[2],
    config.akamaiKey[3]);

  return new Promise(function(fulfill, reject) {
    var urlList = fileList.map(function(file) {
      return config.cacheBaseUrl + '/' + unitCode + '/' + file;
    });
    if (urlList.length === 0) {

      fulfill('no purge');
    } else if (true) {
      Promise.all(urlList.map(url => request(purgeUrl + querystring.stringify({
        'urls': url
      })))).then(() => fulfill(Math.random().toString(32).substr(2))).catch(e => reject(new Error(e)));
    } else {
      // We no longer have akamai
      // Create the Auth Object with the Payload
      eg.auth({
        body: {
          objects: urlList
        },
        path: '/ccu/v3/invalidate/url/production',
        method: 'POST'
      });

      // Send the filelist to Akamai
      eg.send(function(data, response) {
        if (response && response.body) {
          response = JSON.parse(response.body);
          if (response.purgeId) {
            console.log('successful purge!', response.purgeId);
            fulfill(response.purgeId);
          } else {
            console.log('purge error', response);
            // Try to purge it a different way
            Promise.all(urlList.map(url => request(purgeUrl + querystring.stringify({
              'urls': url
            })))).then(() => fulfill(response.purgeId)).catch(e => reject(new Error(e)));
          }
        }
      });
    }
  });
}
module.exports = updateList;
