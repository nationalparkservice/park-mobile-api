var datawrap = require('datawrap');

// Require the external tools
var getParkList = require('./aggregationTools/getParkList'); // = function(unitCode(s)){}; - return array of unitCodes
var generateData = require('./aggregationTools/generateData'); // = function(schemaPath, unitCode) -- returns SchemaJson and ParkJson
var generateSchema = require('./aggregationTools/generateSchema'); // = function({SchemaJson, ParkJson}); -- Returns AppJson
var writeThumbnails = require('./aggregationTools/writeThumbnails'); // = function(config, unitCode, AppJson)
var writeAppJson = require('./aggregationTools/writeAppJson'); // = function(AppJson, unitCode, config)
var writeMetaJson = require('./aggregationTools/writeMetaJson'); // = function(appJson, unitCode, config)

var aggregatePark = function(schemaPath, unitCode, config) {
  return new datawrap.Bluebird(function(fulfill, reject) {
    var taskList = [{
      'name': 'GenerateData',
      'task': generateData,
      'params': [schemaPath, unitCode, config]
    }, {
      'name': 'GenerateSchema',
      'task': generateSchema,
      'params': ['{{GenerateData}}']
    }, {
      'name': 'Write the thumbnails',
      'task': writeThumbnails,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }, {
      'name': 'Generate Data from CartoDB',
      'task': writeAppJson,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }, {
      'name': 'Generate Data from CartoDB',
      'task': writeMetaJson,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }];

    datawrap.runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};

module.exports = function(schemaPath, unitCodes, config) {
  return new datawrap.Bluebird(function(resolve, reject) {
    getParkList(unitCodes)
      .then(function(validParkList) {
        var taskList = validParkList.map(function(unitCode) {
          return {
            'name': 'Aggregate ' + unitCode,
            'task': aggregatePark,
            'params': [schemaPath, unitCode, config]
          };
        });

        datawrap.runList(taskList)
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
};
