var datawrap = require('datawrap'),
  addStatusTools = require('./addStatuses');

// Require the external tools
var tools = {
  getParkList: require('./aggregationTools/getParkList'), // = function(unitCode(s)){}; - return array of unitCodes
  generateData: require('./aggregationTools/generateData'), // = function(schemaPath, unitCode) -- returns SchemaJson and ParkJson
  generateSchema: require('./aggregationTools/generateSchema'), // = function({SchemaJson, ParkJson}); -- Returns AppJson
  writeThumbnails: require('./aggregationTools/writeThumbnails'), // = function(config, unitCode, AppJson)
  writeAppJson: require('./aggregationTools/writeAppJson'), // = function(AppJson, unitCode, config)
  writeMetaJson: require('./aggregationTools/writeMetaJson') // = function(appJson, unitCode, config)
};

var aggregatePark = function(schemaPath, unitCode, config, taskName, thumbnailSites) {
  return new datawrap.Bluebird(function(fulfill, reject) {
    var taskList = [{
      'name': 'GenerateData',
      'task': tools.generateData,
      'params': [schemaPath, unitCode, config]
    }, {
      'name': 'GenerateSchema',
      'task': tools.generateSchema,
      'params': ['{{GenerateData}}']
    }, {
      'name': 'Write the thumbnails',
      'task': tools.writeThumbnails,
      'params': ['{{GenerateSchema}}', unitCode, config, thumbnailSites]
    }, {
      'name': 'Generate Data from CartoDB',
      'task': tools.writeAppJson,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }, {
      'name': 'Generate Data from CartoDB',
      'task': tools.writeMetaJson,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }];

    // Add tools that will keep track of the status for status reporting
    taskList = addStatusTools(taskList, taskName);

    datawrap.runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};

module.exports = function(schemaPath, unitCodes, config, taskName, thumbnailSites) {
  return new datawrap.Bluebird(function(resolve, reject) {
    getParkList(unitCodes)
      .then(function(validParkList) {
        var taskList = validParkList.map(function(unitCode) {
          return {
            'name': 'Aggregate ' + unitCode,
            'task': aggregatePark,
            'params': [schemaPath, unitCode, config, taskName, thumbnailSites]
          };
        });

        datawrap.runList(taskList)
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
};
