var generateData = require('../generateData');
var schemaFile = '../../../app.schema.json';

generateData({
    schema: schemaFile
  }, 'klgo')
  .then(function(r) {
    console.log('Success: ', JSON.stringify(r, null, 1));
  })
  .catch(function(e) {
    console.log('Error: ', e);
  });
