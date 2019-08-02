var fs = require('fs');
var writeMetaJson = require('../writeMetaJson');
var config = require('../../../config');
var removeGithubFile = require('../../github/remove');

var jsonFilePath = '../../../app.schema.json';
var jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

writeMetaJson(jsonData, 'test', config)
  .then(function() {
    console.log('Test Data written successfully');
    removeGithubFile('places_mobile/test/meta.json', config.github, config)
      .then(function() {
        console.log('meta.json removed successfully');
        removeGithubFile('places_mobile/test/meta.min.json', config.github, config)
          .then(function() {
            console.log('meta.min.json removed successfully');
          })
          .catch(function(e) {
            console.log('Error removing meta.min.json', e);
          });
      })
      .catch(function(e) {
        console.log('Error removing meta.json', e);
      });
  })
  .catch(function(e) {
    console.log('Error writing data', e);
    console.log(e.stack || '');
  });
