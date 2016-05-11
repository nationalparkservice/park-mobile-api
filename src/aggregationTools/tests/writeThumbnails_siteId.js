var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var writeThumbnails = require('../writeThumbnails');
var config = require('../../../config');
var schemaFile = './app.schema.json';
var unitCode = 'goga';
var siteId = '788';

console.log('Generating Data');
generateData(schemaFile, unitCode, config)
  .then(function (r) {
    console.log('************* DATA COMPLETED ****************');
    console.log('Schema Data');
    generateSchema(r)
      .then(function (r2) {
        console.log('************* SCHEMA COMPLETED ****************');
        console.log('Thumbnail Data');
        writeThumbnails(r2, unitCode, config, siteId)
          .then(function (r4) {
            console.log('************* Individual Thumbnails COMPLETED ****************');
            console.log('Success: ');
          }).catch(function (e) {
            console.log('Individual Thumbnail Error: ', e);
          });
      })
      .catch(function (e) {
        console.log('Schema Error: ');
      });
  })
  .catch(function (e) {
    console.log('Data Error: ');
  });
