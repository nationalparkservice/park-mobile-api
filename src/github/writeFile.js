var Bluebird = require('bluebird'),
  githubFunctions = require('./githubFunctions'),
  writeData = require('./writeData');

module.exports = function(localFileName, githubFileName, githubSettings, config) {
  githubSettings.filePath = githubFileName;
  return new Bluebird(function(fulfill, reject) {
    // First we read the file
    githubFunctions.readFile(localFileName)
      .then(function(fileData) {
        writeData(fileData, githubFileName, githubSettings, config)
          .then(fulfill)
          .catch(reject);
      }).catch(function(e) {
        reject('Error reading file: ' + e);
      });
  });
};
