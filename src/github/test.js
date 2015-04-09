/* Test Script */
var config = require('../../config');
var remove = require('./remove');
var write = require('./write');

var tests = {
  write: function(params) {
    write.apply(this, params)
      .catch(function(e) {
        console.log('e', e);
      })
      .then(function(res) {
        console.log(JSON.stringify(res, null, 2));
        tests.remove(params);
      });
  },
  remove: function(params) {
    remove.apply(this, params.slice(1))
      .catch(function(e) {
        console.log('e', e);
      })
      .then(function(res) {
        console.log(JSON.stringify(res, null, 2));
      });
  }
};

var baseParams = [
  './test.txt',
  'places_mobile/klgo_legacy/media/test.txt', {
    account: 'nationalparkservice',
    branch: 'gh-pages',
    repo: 'data',
    auth: config.github.auth,
    accessToken: config.github.accessToken
  }, {
    appName: 'Test Script'
  }
];

tests.write(baseParams);
