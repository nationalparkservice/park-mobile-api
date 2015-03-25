var errorLog = require('./errorLog'),
  multer = require('multer');

module.exports = multer({
  dest: './uploads/',
  rename: function(fieldname, filename) {
    return filename.replace(/\W+/g, ' - ').toLowerCase() + Date.now();
  },
  onFileUploadComplete: function(file) {
    errorLog(file.originalname + 'uploaded to ' + file.path);
  }
});
