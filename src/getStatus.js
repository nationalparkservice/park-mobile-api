var storage = require('node-persist');

module.exports = function(req, res) {
  storage.initSync();
  if (req.params.process && storage.getItem(req.params.process)) {
    storage.getItem(req.params.process, function(err, value) {
      if (err) {
        res.send(err);
      } else {
        res.send(value);
      }
    });
  } else {
    res.send('Process "' + req.params.process + '" not found');
  }
};
