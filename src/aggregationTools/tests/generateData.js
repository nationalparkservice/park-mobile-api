var generateData = require('../generateData');
var schemaFile = '../../../app.schema.json';
var config = require('../../../config');

generateData(schemaFile, 'klgo', config)
  .then(function(r) {
    console.log('Success: ', JSON.stringify(r, null, 1));
  })
  .catch(function(e) {
    console.log('Error: ', e);
  });
