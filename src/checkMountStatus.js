/* This module checks to see if the external drive is mounted */
/* it will throw an error if it is not mounted */
var fs = require('fs');
var exec = require('child_process').exec;

var remountDrive = function (testFileLocation, depth, callback) {
  depth = typeof depth === 'number' ? depth - 1 : 0;
  exec('sudo mount -a', function (error, stdout, stderr) {
    if (error || stderr) {
      callback(error || stderr, null);
    } else {
      // console.log('remounted', depth, stdout);
      checkMount(testFileLocation, depth, callback);
    }
  });
};

var checkMount = function (testFileLocation, depth, callback) {
  depth = typeof depth === 'number' ? depth : 1;
  fs.lstat(testFileLocation, function (error, stats) {
    // console.log('errorA', depth, error);
    // console.log('statsA', depth. stats);
    if (!error && stats.isFile()) {
      callback(null, stats);
    } else {
      if (depth > 0) {
        remountDrive(testFileLocation, depth, callback);
      } else {
        callback(error, null);
      }
    }
  });
};

module.exports = function (config, callback) {
  checkMount(config.testFileLocation, config.testFileRetries || 2, callback);
};

/*
checkMount('/mnt/npmap/projects/places-mobile/test.txt', 2, function (e, r) {
  console.log(e, r);
});
*/
