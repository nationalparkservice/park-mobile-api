var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var writeZipFile = require('../writeZipFile');
var config = require('../../buildConfig')();
var schemaFile = '../../../app.schema.json';
var unitCode = 'klgo';
var sizes = null; //['640', '768', '1536', '1080'];

console.log('Generating Data');
generateData(schemaFile, unitCode, config)
  .then(function(data) {
    console.log('************* DATA COMPLETED ****************');
    console.log('Schema Data');
    generateSchema(data)
      .then(function(appJson) {
        console.log('************* SCHEMA COMPLETED ****************');
        console.log('Thumbnail Data');
        writeZipFile(appJson, unitCode, config, sizes)
          .then(function(zipFileResult) {
            console.log('************* All zip files COMPLETED ****************');
            console.log('Success: ', zipFileResult);
          })
          .catch(function(e) {
            console.log('All Thumbnail Error: ', e);
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
