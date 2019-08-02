var aggregate = require('../../aggregate');
var config = require('../../buildConfig')();

aggregate('../../../app.schema.json', ['Brooklyn'] , config)
  .then(function(r) {
    console.log(JSON.stringify(r, null, 2));
    console.log('Success!');
  })
  .catch(function(e) {
    console.log('Failure!');
    throw (e);
  });
