// This tool will read a schema and pull the schema information out of CartoDB
// It takes the following options:
// 'unitCode', //A unit code can be specified, if it is, only that park will be run
// 'schema', // Path to the schema (allows us the use a legacy schema0
// 'default', // ** REQUIRED ** Specify a file to use with default settings
// 'resize' // Which images to resize, falsey means no images, 1 means all images, otherwise you need to specify which images you'd like resize (such as "map_thumbnails")

var datawrap = require('datawrap');
var moment = require('moment');

// Get the datawrap tools
var Bluebird = datawrap.Bluebird;
var runList = datawrap.runList;

// Require the external tools
var getParkList = require('./aggregationTasks/getParkList'); // = function(unitCode){};
var generateSchema = require('./aggregationTasks/generateSchema.js'); // = function(options, unitCode)
var writeThumbnails = require('./aggregationTasks/writeThumbnails.js'); // = function(options, unitCode, AppJson)
var writeAppJson = require('./aggregationTasks/writeAppJson.js'); // = function(options, unitCode, AppJson)
var writeMetaJson = require('./aggregationTasks/writeMetaJson.js'); // = function(options, unitCode, MetaJson)

// If no defaults are specified, use the defaults.json file


// The first step is to query the "Parks" table in CartoDB to get a list of Parks
//   SELECT DISTINCT unit_code FROM places_mobile_parks WHERE is_demo = false;
module.exports = function(options) {
  return new Bluebird(function(resolve, reject) {
    getParkList(options.unitCode)
      .catch(reject)
      .then(function(parks) {
        // Then we loop through the list of parks
        var schemaTasks = parks.map(function(unitCode) {
          return {
            'name': 'Generating the App.json for ' + unitCode,
            'task': generateSchema,
            'params': [options, unitCode]
          };
        });
        runList(schemaTasks, 'Generate App.json')
          .catch(reject)
          .then(function(results) {
            var writeTasks = results.map(function(result) {
              return [{
                // Redraw thumbnails for sites
                'name': 'Writing thumbnails for ' + result.unitCode,
                'task': writeThumbnails,
                'params': [options, result.unitCode, result.json]
              }, {
                // Write the app.json file to github
                'name': 'Writing app.json for ' + result.unitCode,
                'task': writeAppJson,
                'params': [options, result.unitCode, result.json]
              }, {
                // Write the meta file to github
                'name': 'Write meta.json for ' + result.unitCode,
                'task': writeMetaJson,
                'params': [options, result.unitCode, {
                  'api_version': result.apiVersion,
                  'last_data_update': moment().format()
                }]
              }];
            });
            runList(writeTasks, 'Writing the files to github')
              .catch(reject)
              .then(resolve);
          });
      });
  });
};
