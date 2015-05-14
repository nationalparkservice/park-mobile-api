var writeZipFile = require('../writeZipFile');
var AdmZip = require('adm-zip');
var glob = require('glob');
var config = require('../../../config');

var unitCode = 'Brooklyn';

var files = glob.sync('**', {
  cwd: config.fileLocation + '/' + unitCode,
  ignore: 'app.zip',
  nodir: true
});

writeZipFile(unitCode, config)
  .then(function(r) {
    console.log('Zip File Created!', r);
    var missingFiles = 0;
    console.log(r);
    var zip = new AdmZip(r);
    var zippedFiles = zip.getEntries().map(function(entry) {
      return entry.entryName;
    });
    files.forEach(function(file) {
      if (zippedFiles.indexOf(file) < 0) {
        console.log('Missing file: ', file);
        missingFiles++;
      }
      console.log('Successfully zipped ', zippedFiles.length, 'of', files.length, 'files');
    });
  })
  .catch(function(e) {
    console.log('Error', e);
    throw e;
  });
