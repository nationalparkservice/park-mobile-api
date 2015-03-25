/* cleanup.js */
/* This function deletes all files in the image list */
/* This is done using sync to make error trapping easier */
/* returns an array of each file and if it was deleted or errored */

var errorLog = require('./errorLog'),
  fs = require('fs');

module.exports = function(imageList) {
  errorLog('c0');
  var AllFileList = [],
    errorList = [],
    fileList = [];
  errorLog(imageList);
  errorLog('c1');
  imageList.map(function(img) {
    AllFileList.push(img.f);
    AllFileList.push(img.o);
  });
  errorLog('c2');
  fileList = AllFileList.filter(function(elem, pos) {
    return AllFileList.indexOf(elem) === pos;
  });
  errorLog('c3');
  errorLog(fileList);
  errorLog('c4');
  fileList.map(function(file) {
    errorLog('c5');
    try {
      errorLog('c6');
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      errorLog('c7');
      errorList.push({
        'file': file,
        'error': err
      });
    }
  });
  errorLog('c8');
  return {
    'error': errorList.length > 0 ? errorList : null,
    'files': fileList
  };
};
