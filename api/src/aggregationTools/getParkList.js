// Requires
var Promise = require('bluebird');
var config = require('../buildConfig')();
var pg = require('pg');

// Tools

module.exports = function (unitCode) {
  return new Promise(function (fulfill, reject) {
    var fieldName = 'unit_code';
    var parksQuery = 'SELECT DISTINCT {{fieldName}} FROM "park-mobile".places_mobile_parks';
    // fulfill(Array.isArray(unitCode) ? unitCode : [unitCode]);
    let client = new pg.Client({
      user: config.database.internalCarto.username,
      host: config.database.internalCarto.address,
      database: config.database.internalCarto.dbname,
      password: config.database.internalCarto.password,
      port: 5432
    });
    client.connect();
    //database.runQuery(parksQuery.replace('{{fieldName}}', fieldName))
    client.query(parksQuery.replace('{{fieldName}}', fieldName))
      .then(function (result) {
        var availableUnitCodes = result.rows.map(function (row) {
          return row[fieldName];
        });
        if (unitCode) {
          unitCode = Array.isArray(unitCode) ? unitCode : [unitCode];
          availableUnitCodes = availableUnitCodes.filter(function (uc) {
            return unitCode.indexOf(uc) >= 0;
          });
        }
        fulfill(availableUnitCodes);
      })
      .catch(function(e) {
        console.error('ERROR getParkList', e);
        reject(e);
      })
      .finally(function() {
        client.end();
      });
  });
};
