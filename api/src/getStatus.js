var storage = require('node-persist'),
  resWrapper = require('./resWrapper');


module.exports = function(req, origRes) {
  var res = resWrapper(req, origRes);
  storage.initSync();
  if (req.params.process && storage.getItem(req.params.process)) {
    storage.getItem(req.params.process, function(err, value) {
      if (err) {
        res.error(err);
      } else {
        res.send({'status': value});
      }
    });
  } else {
    res.send('Process "' + req.params.process + '" not found');
  }
};
