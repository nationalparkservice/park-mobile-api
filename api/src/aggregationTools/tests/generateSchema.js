var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var config = require('../../buildConfig')();

generateData('klgo', config)
  .then(function(r) {
    console.log('************* DATA COMPLETED ****************');
    generateSchema(r)
      .then(function(r2) {
        console.log('Success: ', r2);
      })
      .catch(function(e) {
        console.log('Schema Error: ', e);
      });
  })
  .catch(function(e) {
    console.log('Data Error: ', e);
  });
