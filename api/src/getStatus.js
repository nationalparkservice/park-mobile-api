var storage = require('node-persist'),
  resWrapper = require('./resWrapper');


module.exports = function(req, origRes) {
  var res = resWrapper(req, origRes);
  storage.init().then(function() {
    console.log('b1');
    if (req.params.process /*&& storage.getItem(req.params.process)*/) {
      console.log('b2');
      storage.getItem(req.params.process).then(function(value) {
        console.log('b3', req.params.process, value);
        res.send({'status': value});
      }).catch(function(err) {
        console.log('b4');
        res.error(err);
      });
    } else {
      console.log('b5');
      res.send('Process "' + req.params.process + '" not found');
    }}).catch(function(err) {
    console.log('b6');
    res.error(err);
  });
};
