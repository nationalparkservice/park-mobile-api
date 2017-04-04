const pool = require('./lib/pool');

// to run a query we just pass it to the pool
// after we're done nothing has to be taken care of
// we don't have to return any client to the pool or close a connection
var insecureQuery = function (queryString, callback) {
  pool.query(query, [], callback);
};

module.exports = function (q, callback) {
  // q is used for the query right to the database
  // format can be either json or geojson
  insecureQuery(q, function (e, r) {
    callback(e, r);
  });
};
