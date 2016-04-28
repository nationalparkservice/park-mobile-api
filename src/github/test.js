/* Test Script */
var config = require('../../config');
var remove = require('./remove');
var writeFile = require('./writeFile');

var tests = {
  write: function (params) {
    console.log('params', params);
    writeFile.apply(this, params)
      .then(function (res) {
        console.log(JSON.stringify(res, null, 2));
        tests.remove(params);
      })
      .catch(function (e) {
        console.log('write error', e);
      });

  },
  remove: function (params) {
    remove.apply(this, params.slice(1))
      .then(function (res) {
        console.log(JSON.stringify(res, null, 2));
      })
      .catch(function (e) {
        console.log('e', e);
      });
  }
};

var baseParams = [
  './test.txt',
  'places-mobile/goga/test.txt', {
    account: 'nationalparkservice',
    branch: 'gh-pages',
    repo: 'projects',
    auth: config.github.auth,
    accessToken: '<token>'
  }, {
    appName: 'Test Script'
  }
];

console.log(baseParams);
tests.write(baseParams);
