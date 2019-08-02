/* globals require */

var fs = require('fs');

module.exports = function (source, dest, callback) {
  var fulfill = function (r) {
      return callback(null, r);
    },
    reject = function (e) {
      return callback(e);
    },
    inputStream = fs.createReadStream(source),
    outputStream = fs.createWriteStream(dest);

  inputStream.pipe(outputStream);
  outputStream.on('error', function (e) {
    reject(e);
  });
  inputStream.on('end', function () {
    fs.unlinkSync(source);
    fulfill();
  });
};
