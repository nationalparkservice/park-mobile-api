/* cleanup.js */
/* This function deletes all files in the image list */
/* This is done using sync to make error trapping easier */
/* returns an array of each file and if it was deleted or errored */

var fs = require('fs');

module.exports = function(imageList) {
  console.log('a10');
  var AllFileList = [],
    errorList = [],
    fileList = [];
  imageList.map(function(img) {
    fileList.push(img.f);
    fileList.push(img.o);
  });
  fileList = AllFileList.filter(function(elem, pos) {
    return AllFileList.indexOf(elem) === pos;
  });
  fileList.map(function(file) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      errorList.push({
        'file': file,
        'error': err
      });
    }
  });
  return {
    'error': errorList.length > 0 ? errorList : null,
    'files': fileList
  };
};
