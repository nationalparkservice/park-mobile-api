var purgeCache = require('../purgeCache');
var config = require('../../../config');
var today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

purgeCache(today, 'heho', config)
  .then(function(r) {
    console.log('Success', r);
  })
  .catch(function(e) {
    console.log('Error', e);
  });
