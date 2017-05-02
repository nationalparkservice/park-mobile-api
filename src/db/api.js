var resWrapper = require('../resWrapper');
var queryDb = require('./queryDb');

var wkx = require('wkx');

var toGeoJson = function (result, geomColumn) {
  geomColumn = geomColumn || 'the_geom';
  var returnValue = {
    'type': 'FeatureCollection',
    'features': []
  };
  var feature = {
    'type': 'Feature',
    'geometry': {},
    'properties': {}
  };

  result.rows.forEach(function (row) {
    var newFeature = JSON.parse(JSON.stringify(feature));
    if (row[geomColumn]) {
      newFeature.properties = row;
      newFeature.geometry = wkx.Geometry.parse(new Buffer(row[geomColumn], 'hex')).toGeoJSON();
      if (newFeature.geometry && newFeature.geometry.type) {
        returnValue.features.push(newFeature);
      }
    }
  });

  return returnValue;
};

var runQuery = function (req, res, accept) {
  var newRes = resWrapper(req, res);
  // console.log(req);
  console.log(req.body);
  var q = decodeURIComponent(req.query.q || req.body.q);
  var format = decodeURIComponent(req.query.format || req.body.format || 'json').toLowerCase();
  var cb = req.query.cb && decodeURIComponent(req.query.cb);
  console.log('q', q);

  if (q.match(accept)) {
    queryDb(q, function (e, r) {
      if (e) {
        newRes.error('Database Error: ' + e);
      } else {
        var result = r;
        if (format === 'geojson') {
          result = toGeoJson(r);
        }
        newRes.send(result, {callback: cb});
      }
    });
  } else {
    newRes.error('Invalid SQL Statement ' + q);
  }
};

module.exports = function (schema) {
  return [{
    'name': 'QUERY database',
    'description': 'Runs a SQL Statement on the database, with no restrictions or validations at all',
    'method': 'POST',
    'path': '/secure',
    'process': function (req, res) {
      var accept = new RegExp(/^(select|insert into|delete from|update) /i);
      runQuery(req, res, accept);
    }
  }, {
    'name': 'QUERY database',
    'description': 'Runs a SQL Statement on the database, with no restrictions or validations at all',
    'method': 'GET',
    'path': '/select',
    'process': function (req, res) {
      var accept = new RegExp(/^(select) /i);
      runQuery(req, res, accept);
    }
  }];
};
