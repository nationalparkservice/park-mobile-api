var generateData = require('../generateData');
var config = require('../../buildConfig')();

generateData('klgo', config)
  .then(function(r) {
    console.log('Success: ', JSON.stringify(r, null, 1));
  })
  .catch(function(e) {
    console.log('Error: ', e);
  });
