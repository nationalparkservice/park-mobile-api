var generateData = require('../generateData');
var generateSchema = require('../generateSchema');
var writeThumbnails = require('../writeThumbnails');
var config = require('../../../config');
var schemaFile = '../../../app.schema.json';
var unitCode = 'Brooklyn';

console.log('Generating Data');
generateData(schemaFile, unitCode, config)
  .then(function(r) {
    console.log('************* DATA COMPLETED ****************');
    console.log('Schema Data');
    generateSchema(r)
      .then(function(r2) {
        console.log('************* SCHEMA COMPLETED ****************');
        console.log('Thumbnail Data');
        writeThumbnails(r2, unitCode, config, true)
          .then(function(r3) {
            console.log('************* All Thumbnails COMPLETED ****************');
            console.log('Success: ', r3);
            writeThumbnails(r2, unitCode, config, 66)
              .then(function(r4) {
                console.log('************* Individual Thumbnails COMPLETED ****************');
                console.log('Success: ', r4);
                writeThumbnails(r2, unitCode, config, [64, 67])
                  .then(function(r5) {
                    console.log('************* Multiple Defined Thumbnails COMPLETED ****************');
                    console.log('Success: ', r5);
                  }).catch(function(e) {
                    console.log('Individual Thumbnail Error: ', e);
                    throw e;
                  });
              }).catch(function(e) {
                console.log('Individual Thumbnail Error: ', e);
                throw e;
              });
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
