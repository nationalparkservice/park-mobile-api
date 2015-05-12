var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

module.exports = function(file) {
  return new Bluebird(function(fulfill, reject) {
    fs.existsAsync(file)
      .then(function() {
        fs.unlinkAsync(file)
          .then(fulfill)
          .catch(reject);
      }).catch(reject);
  });
};
