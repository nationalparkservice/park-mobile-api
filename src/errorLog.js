var config = require('../config');

module.exports = function() {
  if (config.debug) {
    console.log.apply(this, arguments);
  }
};
