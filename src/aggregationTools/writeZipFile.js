var Bluebird = require('datawrap').Bluebird;
var mkdirp = require('mkdirp');
var AdmZip = require('adm-zip');

var cleanArray = function(array) {
  //removes nulls and duplicates
  var newArray = [];
  array.forEach(function(item) {
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
          trunk[branches[0]].forEach(function(d) {
            ids.push(d);
          });
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
    returnValue = appJson.media.filter(function(d) {
      return (d.type && d.type === template.type && ids.indexOf(d.id) >= 0);
    });
  }

  return returnValue;
};


var getFiles = function(mediaTemplate, field, appJson, config, unitCode) {
  var fileList = [];
  var media;
  var prefix = config.fileLocation + '/' + (mediaTemplate.type === 'icon' ? 'icons/' : unitCode + '/media/');
  if (mediaTemplate.reference) {
    //MAGIC
    media = getMediaList(mediaTemplate, appJson);
  } else {
    media = appJson.media.filter(function(d) {
      return d.type === mediaTemplate.type;
    });
  }

  fileList = media.map(function(medium) {
    return medium[field] ? prefix + medium[field] : null;
  });

  return cleanArray(fileList);
};

module.exports = function(appJson, unitCode, config, sizes) {

  return new Bluebird(function(fulfill, reject) {
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
      var zip = new AdmZip();
      var fileList = [],
        errorList = [];
      try {
        for (var mediaType in config.zipTemplate) {
          if (config.zipTemplate[mediaType] && config.zipFields[size]) {
            // Extract the field from the config
            var getFilesRes = getFiles(config.zipTemplate[mediaType], config.zipFields[size][mediaType], appJson, config, unitCode);
            fileList = cleanArray(fileList.concat(getFilesRes));
          }
        }
        fileList.forEach(function(file) {
          var path = file.replace(config.fileLocation + '/', '');
          if (path.substr(0, 5) !== 'icons') {
            path = path.replace(/^.+?\//g, '');
          }
          try {
            zip.addLocalFile(file, path);
          } catch (e) {
            errorList.push(e);
          }
        });
        zip.writeZip(archiveDirectory + size + '.zip');
        allFiles[size] = allFiles[size] || {};
        allFiles[size].results = fileList;
        allFiles[size].errors = errorList;
      } catch (e) {
        reject(e);
      }
    });
    fulfill(allFiles);
  });
};
