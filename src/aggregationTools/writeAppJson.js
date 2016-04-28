var Bluebird = require('datawrap').Bluebird;
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var writeData = require('../github/writeData');
Bluebird.promisifyAll(fs);

var bomify = function (text) {
  // Add the utf8 Byte Order Mark
  // https://en.wikipedia.org/wiki/Byte_order_mark#UTF-8
  return '\uFEFF' + text.replace(/^\uFEFF/, '');
};

module.exports = function (appJson, unitCode, config) {
  return new Bluebird(function (fulfill, reject) {
    var filePath = config.fileLocation + '/' + unitCode + '/app.json';
    var minFilePath = filePath.replace(/\.json$/, '.min.json');
    mkdirp(path.dirname(filePath), function (err) {
      if (err) {
        reject(err);
      } else {
        fs.writeFileAsync(filePath, bomify(JSON.stringify(appJson, null, 2)), 'utf8')
          .then(function (r) {
            fs.writeFileAsync(minFilePath, bomify(JSON.stringify(appJson)), 'utf8')
              .then(function (r2) {
                fulfill([r, r2]);
              /*
              // Write it to github
              var githubSettings = JSON.parse(JSON.stringify(config.github));
              githubSettings.accessToken = githubSettings.accessToken.match('/secrets/') ? fs.readFileSync(githubSettings.accessToken).toString().replace(/\n/g, '') : githubSettings.accessToken;
              var githubPath = 'places-mobile/' + unitCode + '/app.min.json';
              writeData(bomify(JSON.stringify(appJson)), githubPath, githubSettings, config)
                .then(function (r3) {
                  fulfill([r, r2, r3]);
                }).catch(reject);
                */
              })
              .catch(reject);
          })
          .catch(reject);
      }
    });
  });
};
