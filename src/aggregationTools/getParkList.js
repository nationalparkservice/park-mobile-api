// Requires
var datawrap = require('datawrap');
var config = require('../../config');

// Tools
var database = datawrap(config.database.cartodb, config.database.defaults);
var Bluebird = datawrap.Bluebird;

module.exports = function(unitCode) {
  return new Bluebird(function(fulfill, reject) {
    var fieldName = 'unit_code',
    parksQuery = 'SELECT DISTINCT {{fieldName}} FROM places_mobile_parks WHERE is_demo = false';
    if (unitCode) {
      fulfill(Array.isArray(unitCode) ? unitCode : [unitCode]);
    } else {
      database.runQuery(parksQuery, {fieldName: fieldName})
        .catch(reject)
        .then(function(result) {
          fulfill(result[0].rows.map(function(row) {
            return row[fieldName];
          }));
        });
    }
  });
};
