var fs = require('fs');
var Bluebird = require('datawrap').Bluebird;
var writeAppJson = require('../writeAppJson');
var config = require('../../buildConfig')();
fs = Bluebird.promisifyAll(fs);

var jsonData = config.appSchemaJson;

writeAppJson(jsonData, 'test', config)
  .then(function() {
    console.log('Test Data written successfully');
    fs.unlinkAsync(config.fileLocation + '/test/app.json')
      .then(function() {
        console.log('app.json removed successfully');
        fs.unlinkAsync(config.fileLocation +'/test/app.min.json')
          .then(function() {
            console.log('app.min.json removed successfully');
          })
          .catch(function(e) {
            console.log('Error removing app.min.json', e);
          });
      })
      .catch(function(e) {
        console.log('Error removing app.json', e);
      });
  })
  .catch(function(e) {
    console.log('Error writing data', e);
    console.log(e.stack || '');
  });
