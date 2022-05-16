var JSZip = require('jszip');
var mkdirp = require('../mkdirpCallback');
var path = require('path');
var fs = require('fs').promises;

var cleanArray = function(array) {
  // removes nulls and duplicates
  var newArray = [];
  array.forEach(item => {
    if ((item || item === 0) && (newArray.indexOf(item) === -1)) {
      newArray.push(item);
    }
  });
  return newArray;
};

var getMediaList = function(template, appJson) {
  var ref = template.reference.split('.');
  var ids = [];
  var returnValue;

  var readTree = function(trunk, branches) {
    if (branches.length === 1) {
      if (trunk[branches[0]]) {
        if (Array.isArray(trunk[branches[0]])) {
          trunk[branches[0]].forEach(d => ids.push(d));
        } else {
          ids.push(trunk[branches[0]].id || trunk[branches[0]]);
        }
      }
    } else {
      for (var i in trunk[branches[0]]) {
        readTree(trunk[branches[0]][i], branches.slice(1));
      }
    }
  };

  readTree(appJson, ref);
  ids = cleanArray(ids);
  if (template.type === 'icon') {
    returnValue = ids;
  } else {
    returnValue = appJson.media.filter(d => (d.type && d.type === template.type && ids.indexOf(d.id) >= 0));
  }

  return returnValue;
};

var getFiles = function(mediaTemplate, field, appJson, config, unitCode) {
  var fileList = [];
  var media;
  var prefix = config.fileLocation + '/' + (mediaTemplate.type === 'icon' ? 'icons/' : unitCode + '/media/');
  if (mediaTemplate.reference) {
    // MAGIC
    media = getMediaList(mediaTemplate, appJson);
  } else {
    media = appJson.media.filter(d => d.type === mediaTemplate.type);
  }

  fileList = media.map(medium => medium[field] ? prefix + medium[field] : null);

  return cleanArray(fileList);
};

module.exports = function(appJson, unitCode, config, sizes) {
  return new Promise((resolve, reject) => {
    var archiveDirectory = config.fileLocation + '/' + unitCode + '/archives/';
    var allFiles = {};
    sizes = sizes || function() {
      var returnValue = [];
      for (var size in config.zipFields) {
        returnValue.push(size);
      }
      return returnValue;
    }();
    mkdirp.sync(archiveDirectory);

    sizes.forEach(function(size) {
      var zip = new JSZip();
      var fileList = [];
      var errorList = [];
      try {
        for (var mediaType in config.zipTemplate) {
          if (config.zipTemplate[mediaType] && config.zipFields[size]) {
            // Extract the field from the config
            var getFilesRes = getFiles(config.zipTemplate[mediaType], config.zipFields[size][mediaType], appJson, config, unitCode);
            fileList = cleanArray(fileList.concat(getFilesRes));
          }
        }

        Promise.all(fileList.map(function(file) {
          return new Promise((fileResolve, fileReject) => {
            fs.readFile(file).then(fileBuffer => {
              var filePath = file.replace(config.fileLocation + '/', '');
              if (filePath.substr(0, 5) !== 'icons') {
                filePath = filePath.replace(/^.+?\//g, '');
              }
              // filePath = path.dirname(filePath);
              // Put all the files in the root
              filePath = filePath.replace(/^.+?\/|^.+/g, '');
              try {
                zip.file(filePath, fileBuffer);
                // console.log('success', filePath, file, fileBuffer.length);
              } catch (e) {
                console.log('ERROR', e);
                errorList.push(e);
              }
              fileResolve(file);
            }).catch(e => {
              // Report missing file
              console.log('Missing File:', file);
              fileResolve(file);
            });
          })
        })).then(() => {
          zip.generateAsync({
            type: 'nodebuffer'
          }).then(content => {
            fs.writeFile(archiveDirectory + size + '.zip', content).then(() => {
              allFiles[size] = allFiles[size] || {};
              allFiles[size].results = fileList;
              allFiles[size].errors = errorList;
              resolve(allFiles);
            });
          }).catch(e => reject(e));
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};
