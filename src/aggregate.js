var iterateTasks = require('./iterateTasks');
var Promise = require('bluebird');
var checkMountStatus = require('./checkMountStatus');
var addStatusTools = require('./addStatuses');

// Require the external tools
var tools = {
  getParkList: require('./aggregationTools/getParkList'), // = function(unitCode(s)){}; - return array of unitCodes
  generateData: require('./aggregationTools/generateData'), // = function(schemaPath, unitCode) -- returns SchemaJson and ParkJson
  generateSchema: require('./aggregationTools/generateSchema'), // = function({SchemaJson, ParkJson}); -- Returns AppJson
  writeThumbnails: require('./aggregationTools/writeThumbnails'), // = function(config, unitCode, AppJson)
  writeAppJson: require('./aggregationTools/writeAppJson'), // = function(AppJson, unitCode, config)
  writeMetaJson: require('./aggregationTools/writeMetaJson'), // = function(appJson, unitCode, config)
  writeZipFile: require('./aggregationTools/writeZipFile'), // = function(appJson, unitCode, config, sizes)
  purgeCache: require('./aggregationTools/purgeCache') // = function(startDate, unitCode, config)
};

var aggregatePark = function (schemaPath, unitCode, config, taskName, generateJson, thumbnailSites) {
  return new Promise(function (fulfill, reject) {
    var taskList = [{
      'name': 'startDate',
      'task': function () {
        return new Promise(function (fulfill) {
          fulfill(new Date());
        });
      },
      'params': []
    }, {
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
    }];

    var appJsonTasks = [{
      'name': 'Generate Data from CartoDB',
      'task': tools.writeAppJson,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }, {
      'name': 'Generate Data from CartoDB',
      'task': tools.writeMetaJson,
      'params': ['{{GenerateSchema}}', unitCode, config, '{{Generate Data from CartoDB}}']
    }, {
      'name': 'Generate zip file',
      'task': tools.writeZipFile,
      'params': ['{{GenerateSchema}}', unitCode, config]
    }, {
      'name': 'Purge Cached Data',
      'task': tools.purgeCache,
      'params': ['{{startDate}}', unitCode, config]
    }];

    // Only regenerate the json if it was requested
    if (generateJson) {
      appJsonTasks.forEach(function (task) {
        taskList.push(task);
      });
    }
    taskList = addStatusTools(taskList, taskName);

    checkMountStatus(config, function (mountE, mountR) {
      if (!mountE && mountR) {
        return iterateTasks(taskList, 'Main Task List', config.debug);
      } else {
        throw new Error('Error mounting drive: ' + mountE);
      }
    });
  });
};

module.exports = function (schemaPath, unitCodes, config, taskName, generateJson, thumbnailSites) {
  return tools.getParkList(unitCodes)
    .then(function (validParkList) {
      var taskList = validParkList.map(function (unitCode) {
        return {
          'name': 'Aggregate ' + unitCode,
          'task': aggregatePark,
          'params': [schemaPath, unitCode, config, taskName, generateJson, thumbnailSites]
        };
      });

      return iterateTasks(taskList, 'Aggregating parks ' + validParkList.join(','), config.debug);
    });
};
