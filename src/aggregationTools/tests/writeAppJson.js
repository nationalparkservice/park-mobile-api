var fs = require('fs');
var writeAppJson = require('../writeAppJson');
var config = require('../../../config');
var removeGithubFile = require('../../github/remove');

var jsonFilePath = '../../../app.schema.json';
var jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

writeAppJson(jsonData, 'test', config)
  .then(function() {
    console.log('Test Data written successfully');
    removeGithubFile('places_mobile/test/app.json', config.github, config)
      .then(function() {
        console.log('app.json removed successfully');
        removeGithubFile('places_mobile/test/app.min.json', config.github, config)
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
