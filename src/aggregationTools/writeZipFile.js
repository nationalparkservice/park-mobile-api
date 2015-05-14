var Bluebird = require('datawrap').Bluebird;
var path = require('path');
var AdmZip = require('adm-zip');
var glob = require('glob');

module.exports = function(unitCode, config) {
  var zip = new AdmZip();

  return new Bluebird(function(fulfill, reject) {
    var archiveDirectory = config.fileLocation + '/' + unitCode;
    var archiveFilename = '/app.zip';
    var filePath = archiveDirectory + archiveFilename;

    glob('**', {
      cwd: archiveDirectory,
      ignore: archiveFilename,
      nodir: true
    }, function(e, r) {
      if (e) {
        reject(e);
      } else {
        try {
          r.map(function(fileName) {
            zip.addLocalFile(archiveDirectory + '/' + fileName, path.dirname(fileName) !== '.' ? path.dirname(fileName) : null, path.basename(fileName));
          });
        } catch (e) {
          reject(e);
        }
        zip.writeZip(filePath);
        fulfill(filePath);
      }
    });
  });
};
