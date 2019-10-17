// This reads the schema file and downloads the associated information from CartoDB

// Requires
var Promise = require('bluebird');
var datawrap = require('datawrap');
var fandlebars = require('fandlebars');
var fs = require('fs');
var iterateTasks = require('../iterateTasks');

Promise.promisifyAll(fs);

var readTypes = {
  'http': {
    'cartodb': function (schemaPart, unitCode, config) {
      return new Promise(function (fulfill, reject) {
        var buildSql = function () {
          var sqlParts = schemaPart.source.sql;
          var sqlString = 'SELECT {{fields}} FROM {{table}} WHERE {{where}}{{extras}}';
          var getFields = function (props, fields) {
            // Get the fields from the properties
            var newFields = [];
            for (var property in props) {
              if (!props[property].transformation || props[property].transformation === 'StringToArray') {
                if (!props[property].noColumn) {
                  newFields.push('"' + (props[property].alias || property) + '"');
                }
              }
            }

            // Replace the '*' with the new fields
            if (fields.indexOf('*') >= 0 && newFields.length) {
              newFields = fields.slice(0, fields.indexOf('*')).concat(newFields).concat(fields.slice(fields.indexOf('*') + 1));
            } else {
              newFields = fields;
            }
            return newFields;
          };

          // Fields
          sqlParts.properties = schemaPart.items ? schemaPart.items.properties : schemaPart.properties;
          if (sqlParts.properties) {
            sqlParts.fields = getFields(sqlParts.properties, sqlParts.fields || ['*']);
          }
          if (schemaPart.key) sqlParts.fields.unshift(schemaPart.key);

          // Assign values from schemaPart
          sqlParts.text = {};
          // Assign Fields
          sqlParts.text.fields = sqlParts.fields ? sqlParts.fields.join(', ') : '';
          // Assign Table
          sqlParts.text.table = '"' + sqlParts.table + '"';
          // Assign Where Clause
          sqlParts.text.where = (sqlParts.where ? '(' + sqlParts.where + ') AND ' : '') + '"unit_code"=\'' + unitCode + '\'';
          // Assign Order By
          sqlParts.text.extras = sqlParts.orderby ? ' ORDER BY ' + sqlParts.orderby : '';

          return sqlParts.fields ? fandlebars(sqlString, sqlParts.text) : false;
        };

        var sqlStatement = buildSql();
        if (!sqlStatement) {
          reject('No fields');
        } else {
          datawrap(config.database.cartodb, config.database.defaults).runQuery(sqlStatement)
            .then(function (result) {
              if (result[0] && result[0].rows) {
                fulfill(result[0].rows);
              } else {
                reject('No rows');
              }
            })
            .catch(reject);
        }
      });
    }
  }
};

var readSource = function (schemaPart, unitCode, config) {
  var sourceInfo = schemaPart.source;

  return new Promise(function (fulfill, reject) {
    if (readTypes[sourceInfo.type] && readTypes[sourceInfo.type][sourceInfo.format]) {
      readTypes[sourceInfo.type][sourceInfo.format](schemaPart, unitCode, config)
        .then(function (data) {
          fulfill({
            'data': data,
            'format': sourceInfo.format,
            'metadata': sourceInfo.metadata,
            'path': sourceInfo.path
          });
        })
        .catch(reject);
    } else {
      reject('Invalid type (' + sourceInfo.type + ') or format: (' + sourceInfo.format + ')');
    }

  });
};

var readData = function (schema, unitCode, config) {
  var taskList = [];
  var getData = function (schemaPart) {
    var field;
    if (schemaPart.source && typeof (schemaPart.source) === 'object' && !Array.isArray(schemaPart.source)) {
      // This schemaPart has a source
      taskList.push({
        'name': 'Getting a schemaPart',
        'task': readSource,
        'params': [schemaPart, unitCode, config]
      });
    }
    if (schemaPart.properties && typeof (schemaPart.properties) === 'object' && !Array.isArray(schemaPart.properties)) {
      // Properties list, start a recursive function
      for (field in schemaPart.properties) {
        getData(schemaPart.properties[field]);
      }
    }
    if (schemaPart.items && schemaPart.items.properties) {
      getData(schemaPart.items);
    }
  };

  // Build the taskList
  getData(schema);

  return iterateTasks(taskList);
};

module.exports = function(unitCode, config) {
  return new Promise(function(fulfill, reject) {
    // Read the Schema File
    var schema = JSON.parse(JSON.stringify(config.appSchemaJson));
    readData(schema, unitCode, config)
      .then(function(parkData) {
        fulfill({
          schemaJson: schema,
          parkJson: parkData
        });
      })
      .catch(function(error) {
        reject(error);
      });
  });
};
