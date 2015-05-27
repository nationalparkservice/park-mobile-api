// Requires
var datawrap = require('datawrap');
var config = require('../../config');
var fs = require('fs');

// Tools
config.database.cartodb.apiKey = fs.readFileSync(config.database.cartodb.apiKey).toString();
var database = datawrap(config.database.cartodb, config.database.defaults);
var Bluebird = datawrap.Bluebird;

module.exports = function(unitCode) {
  return new Bluebird(function(fulfill, reject) {
    var fieldName = 'unit_code',
      parksQuery = 'SELECT DISTINCT {{fieldName}} FROM places_mobile_parks WHERE is_demo = false';
    //fulfill(Array.isArray(unitCode) ? unitCode : [unitCode]);
    database.runQuery(parksQuery, {
        fieldName: fieldName
      })
      .then(function(result) {
        var availableUnitCodes = result[0].rows.map(function(row) {
          return row[fieldName];
        });
        if (unitCode) {
          unitCode = Array.isArray(unitCode) ? unitCode : [unitCode];
          availableUnitCodes = availableUnitCodes.filter(function(uc) {
            return unitCode.indexOf(uc) >= 0;
          });
        }
        fulfill(availableUnitCodes);
      })
      .catch(reject);
  });
};
