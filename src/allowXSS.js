var methodOverride = require('method-override');

module.exports = function(app) {
  // Allow Cross Site Requests
  var allowCrossDomain = function(req, res, next) {
    var methods = 'GET,PUT,POST,DELETE,OPTIONS';
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', methods);
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  };

  app.use(allowCrossDomain);
  app.use(methodOverride('X-HTTP-Method-Override'));
};
