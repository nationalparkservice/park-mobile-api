// Requires
var datawrap = require('datawrap');
var readFile = require('../github/githubFunctions.js').readFile;
var request = require('request');

// Tools
var Bluebird = datawrap.Bluebird;
var runList = datawrap.runList;

var readSchemaFile = function(options) {
  return new Bluebird(function(fulfill, reject) {
    // Read the Schema File
    if (options.schema) {
      readFile(options.schema)
        .catch(reject)
        .then(fulfill);
    } else {
      reject('No schema');
    }
  });
};

var readTypes = {
  'http': {
    'cartodb': function(schemaPart, unitCode) {
      return new Bluebird(function(fulfill, resolve) {

        var buildSql = function(source) {
          var sqlParts = {},
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
            if (!sqlParts.fields.length) {
              sqlParts.fields = getFields(sqlParts.properties);
            } else if (sqlParts.fields.indexOf('*') > -1) {
              sqlParts.fields = sqlParts.fields.filter(function(f) {
                return f !== '*';
              });
              sqlParts.fields = sqlParts.fields.concat(getFields(sqlParts.properties));
            }
          }

          // Assign values from schemaPart


          return source;
        };
      });
    }
  }
};

var readSource = function(schemaPart, unitCode) {
  var sourceInfo = schemaPart.source,
    format = sourceInfo.format,
    metadata = sourceInfo.metadata,
    path = sourceInfo.path,
    type = sourceInfo.type;

  return new Bluebird(function(fulfill, reject) {
    if (readTypes[type] && readTypes[type][format]) {
      readTypes[type][format](path, sourceInfo, unitCode, schemaPart)
        .catch(reject)
        .then(function(a) {
          console.log(a, metadata);
          // tools.read.returnJson(path, format, metadata)
        });
    } else {
      reject('Invalid type (' + type + ') or format: (' + format + ')');
    }

  });
};

var readSchema = function(schema, unitCode) {
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
      .catch(reject)
      .then(fulfill);
  });
};

module.exports = function(options, unitCode) {
  return new Bluebird(function(fulfill, reject) {
    // Read the Schema File
    readSchemaFile(options.schema)
      .catch(reject)
      .then(function(schema) {
        readSchema(schema, unitCode)
          .catch(reject)
          .then(function(schemaData) {
            console.log(schemaData);
          });
      });
  });
};
