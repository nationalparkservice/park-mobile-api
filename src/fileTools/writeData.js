var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

module.exports = function(fileData, file) {
  return new Bluebird(function(fulfill, reject) {
    fs.writeFileAsync(file, fileData)
      .then(fulfill)
      .catch(reject);
  });
};
