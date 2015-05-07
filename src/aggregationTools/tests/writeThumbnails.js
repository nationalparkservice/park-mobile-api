var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var writeThumbnails = require('../writeThumbnails');
var config = require('../../../config');
var schemaFile = '../../../app.schema.json';

console.log('Generating Data');
generateData({
    schema: schemaFile
  }, 'klgo')
  .then(function(r) {
    console.log('************* DATA COMPLETED ****************');
    console.log('Schema Data');
    generateSchema(r.schema, r.parkData)
      .then(function(r2) {
        console.log('************* SCHEMA COMPLETED ****************');
        console.log('Thumbnail Data');
        writeThumbnails(config, 'klgo', r2).then(function(r3) {
          console.log('************* Thumbnail COMPLETED ****************');
          console.log('Success: ', r3);
        }).catch(function(e) {
          console.log('Thumbnail Error: ', e);
          throw e;
        });
      })
      .catch(function(e) {
        console.log('Schema Error: ', e);
      });
  })
  .catch(function(e) {
    console.log('Data Error: ', e);
  });
