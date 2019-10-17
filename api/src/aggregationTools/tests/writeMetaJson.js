var writeMetaJson = require('../writeMetaJson');
var config = require('../../buildConfig')();
var removeGithubFile = require('../../github/remove');

var jsonData = config.appSchemaJson;

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
