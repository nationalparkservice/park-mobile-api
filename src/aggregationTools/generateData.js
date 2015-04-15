// Requires
var datawrap = require('datawrap');
var config = require('../../config');
var readFile = require('../github/githubFunctions.js').readFile;

// Tools
var Bluebird = datawrap.Bluebird;
var fandlebars = datawrap.fandlebars;
var runList = datawrap.runList;

var readSchemaFile = function(schemaFile) {
  return new Bluebird(function(fulfill, reject) {
    // Read the Schema File
    if (schemaFile) {
      readFile(schemaFile, 'utf8')
        .then(function(schemaData) {
          var schema;
          try {
            schema = JSON.parse(schemaData);
            fulfill(schema);
          } catch (e) {
            reject('Error Parsing Schema JSON:' + e);
          }
        })
        .catch(reject);
    } else {
      reject('No schema');
    }
  });
};

var readTypes = {
  'http': {
    'cartodb': function(schemaPart, unitCode) {
      return new Bluebird(function(fulfill, reject) {
        var buildSql = function() {
          var sqlParts = schemaPart.source.sql,
            sqlString = 'SELECT {{fields}} FROM {{table}} WHERE {{where}}{{extras}}',
            getFields = function(props) {
              // Get the fields from the schema
              var newFields = [];
              for (var property in props) {
                if (!props[property].transformation || props[property].transformation === 'StringToArray') {
                  if (!props[property].noColumn) {
                    newFields.push('"' + (props[property].alias || property) + '"');
                  }
                }
              }
              return newFields;
            };

          // Fields
          sqlParts.properties = schemaPart.items ? schemaPart.items.properties : schemaPart.properties;
          if (sqlParts.properties) {
            if (!(sqlParts.fields && !sqlParts.fields.length)) {
              sqlParts.fields = getFields(sqlParts.properties);
            } else if (sqlParts.fields.indexOf('*') > -1) {
              sqlParts.fields = sqlParts.fields.filter(function(f) {
                return f !== '*';
              });
              sqlParts.fields = sqlParts.fields.concat(getFields(sqlParts.properties));
            }
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
            .then(function(result) {
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

var readSource = function(schemaPart, unitCode) {
  var sourceInfo = schemaPart.source;

  return new Bluebird(function(fulfill, reject) {
    if (readTypes[sourceInfo.type] && readTypes[sourceInfo.type][sourceInfo.format]) {
      readTypes[sourceInfo.type][sourceInfo.format](schemaPart, unitCode)
        .then(function(data) {
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

var readData = function(schema, unitCode) {
  var taskList = [];
  var getData = function(schemaPart) {
    var field;
    if (schemaPart.source && typeof(schemaPart.source) === 'object' && !Array.isArray(schemaPart.source)) {
      // This schemaPart has a source
      taskList.push({
        'name': 'Getting a schemaPart',
        'task': readSource,
        'params': [schemaPart, unitCode]
      });
    }
    if (schemaPart.properties && typeof(schemaPart.properties) === 'object' && !Array.isArray(schemaPart.properties)) {
      // Properties list, start a recursive function
      for (field in schemaPart.properties) {
        getData(schemaPart.properties[field]);
      }
    }
    if (schemaPart.items && schemaPart.items.properties) {
      getData(schemaPart.items);
    }
  };

  return new Bluebird(function(fulfill, reject) {
    // Build the taskList
    getData(schema);

    runList(taskList)
      .then(fulfill)
      .catch(reject);
  });
};

module.exports = function(options, unitCode) {
  return new Bluebird(function(fulfill, reject) {
    // Read the Schema File
    readSchemaFile(options.schema)
      .then(function(schema) {
        readData(schema, unitCode)
          .then(function(parkData) {
            fulfill({schema: schema, parkData: parkData});
          })
          .catch(reject);
      })
      .catch(reject);
  });
};
