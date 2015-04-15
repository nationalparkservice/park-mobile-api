var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var schemaFile = '../../../app.schema.json';

generateData({
    schema: schemaFile
  }, 'klgo')
  .then(function(r) {
    console.log('************* DATA COMPLETED ****************');
    generateSchema(r.schema, r.parkData)
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
