var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

module.exports = function(filename, filepath) {
  return new Bluebird(function(fulfill, reject) {
    var file = filepath + '/' + filename;
    fs.existsAsync(file)
      .then(function() {
        fs.unlinkAsync(file)
          .then(fulfill)
          .catch(reject);
      }).catch(reject);
  });
};
