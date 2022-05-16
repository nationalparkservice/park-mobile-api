var mkdirp = require('mkdirp');
var mkdirpCallback = function () {
  var callback = [...arguments].pop();
  var newArgs = [...arguments].slice(0,-1);
  mkdirp.apply(this, newArgs).then(function() {
    callback();
  }).catch(function(e) {
    callback(e);
  });
};

Object.keys(mkdirp).forEach(key => mkdirpCallback[key] = mkdirp[key]);

module.exports = mkdirpCallback;
