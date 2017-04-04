var resWrapper = require('../resWrapper');
var queryDb = require('./queryDb');

var runQuery = function (req, res, accept) {
  var newRes = resWrapper(req, res);
  var q = decodeURIComponent(req.params.q);
  var format = decodeURIComponent(req.params.format || 'json').toLowerCase();

  if (q.match(accept)) {
    queryDb(sql, function (e, r) {
      if (e) {
        newRes.error('Database Error: ' + e);
      } else {
        newRes.send(r);
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
    'method': 'GET',
    'path': '/secure',
    'process': function (req, res) {
      accept = new RegExp(/^(select|insert into|delete from|update) /i);
      runQuery(req, res, accept);
    }
  }, {
    'name': 'QUERY database',
    'description': 'Runs a SQL Statement on the database, with no restrictions or validations at all',
    'method': 'GET',
    'path': '/select',
    'process': function (req, res) {
      accept = new RegExp(/^(select) /i);
      runQuery(req, res, accept);
    }
  }];
};
