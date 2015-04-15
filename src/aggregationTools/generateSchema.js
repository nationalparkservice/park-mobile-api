var Bluebird = require('bluebird');

var tools = {
  format: {
    toArray: function(value) {
      return Array.isArray(value) ? value : [value];
    },
    number: function(value) {
      return isNaN(value) ? value : parseFloat(value, 10);
    },
    value: function(value, types, transformation, schemaPart, data) {
      var returnValue, tempValue;
      if ((!value || value === '') && types.indexOf('null') > -1) {
        returnValue = null;
      } else if (types[0] === 'number') {
        returnValue = tools.format.number(value);
      } else if (types[0] === 'array' && transformation && value) {
        if (transformation === 'StringToArray') {
          tempValue = value.replace(/^\[|\]$/g, '').split(',');
          returnValue = [];
          if (schemaPart.source) {
            //Map the values to the source
            returnValue = tools.read.rows(schemaPart, data, {
              'field': schemaPart.key || 'id',
              'values': tempValue
            });
          } else {
            tempValue.map(function(v) {
              returnValue.push(tools.format.number(v));
            });
          }
        } else {
          returnValue = 'ARRAY COMING SOON';
        }
      } else {
        returnValue = value;
      }
      return returnValue;
    }
  },
  readValue: function(value, types, transformation, schemaPart, data) {
    var returnValue, tempValue;
    if ((!value || value === '') && types.indexOf('null') > -1) {
      returnValue = null;
    } else if (types[0] === 'number') {
      returnValue = tools.format.number(value);
    } else if (types[0] === 'array' && transformation && value) {
      if (transformation === 'StringToArray') {
        tempValue = value.replace(/^\[|\]$/g, '').split(',');
        returnValue = [];
        if (schemaPart.source) {
          //Map the values to the source
          returnValue = tools.read.rows(schemaPart, data, {
            'field': schemaPart.key || 'id',
            'values': tempValue
          });
        } else {
          tempValue.map(function(v) {
            returnValue.push(tools.format.number(v));
          });
        }
      } else {
        returnValue = 'ARRAY COMING SOON';
      }
    } else {
      returnValue = value;
    }

    return returnValue;
  },
  read: {
    schema: function(schemaPart, data, depth) {
      console.log(tools.format.toArray(schemaPart.type));
      depth += 1; // Mostly for debugging
      var part,
        type = tools.format.toArray(schemaPart.type),
        field;
      if (type.indexOf('object') > -1) {
        part = {};
        for (field in schemaPart.properties) {
          if (schemaPart.properties[field].type.indexOf('object') > -1 || schemaPart.properties[field].type.indexOf('array') > -1) {
            part[field] = tools.read.schema(schemaPart.properties[field], data, depth);
          } else {
            part[field] = tools.read.value(schemaPart, data, field, null);
          }
        }
      } else if (type.indexOf('array') > -1) {
        // This will loop through the json file
        if (schemaPart.source) {
          part = tools.read.rows(schemaPart, data, null);
        }
      } else {
        // This condition should never occur
        part = 'FIXME'; //tools.format.toArray(schemaPart.type)[0];
      }
      return part;
    },
    rows: function(schemaPart, data, filterBy) {
      var rows = [],
        jsonFile = data.filter(function(d) {
          return d.path === schemaPart.source.path && d.format === schemaPart.source.format;
        })[0].data;
      // Filter out the values required for this step
      if (filterBy) {
        jsonFile = jsonFile.filter(function(d) {
          return filterBy.values.indexOf(d[filterBy.field].toString()) > -1;
        });
        var temp = [];
        // Set the order for the data (this is done after the filter because it needs to loop through far less items)
        filterBy.values.map(function(id) {
          jsonFile.map(function(d) {
            if (d[filterBy.field].toString() === id) temp.push(d);
          });
        });
        jsonFile = temp;
      }
      jsonFile.map(function(record) {
        var row = {},
          alias,
          field,
          properties = schemaPart.items ? schemaPart.items.properties : schemaPart.properties;
        for (field in properties) {
          alias = properties[field].alias || field;
          row[field] = tools.format.value(record[alias], properties[field].type, properties[field].transformation, properties[field], data);
        }
        // Allow the option to only have one value in the object
        if (schemaPart.items && schemaPart.items.transformation === 'value') {
          row = row[field];
        }
        rows.push(row);
      });
      return rows;
    },
    value: function(schemaPart, data, value, filterBy) {
      var returnValue = null,
        tryRows = tools.read.rows(schemaPart, data, filterBy);
      if (tryRows && tryRows[0] && tryRows[0][value]) {
        returnValue = tryRows[0][value];
      }
      return returnValue;
    }
  }
};
module.exports = function(schemaFile, parkData) {
  return new Bluebird(function(fulfill, reject) {
    var returnValue = {};
    try {
      returnValue = tools.read.schema(schemaFile, parkData, 0);
      fulfill(returnValue);
    } catch (e) {
      reject(e);
    }
  });
};
