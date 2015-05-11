var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

module.exports = function(origFile, newFile) {
  return new Bluebird(function(fulfill, reject) {
    fs.rename(origFile, newFile)
      .then(fulfill)
      .catch(reject);
  });
};
