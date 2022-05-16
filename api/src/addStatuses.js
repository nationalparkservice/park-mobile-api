var Promise = require('bluebird');
var storage = require('node-persist');

var statusFunction = function (status, name) {
  return new Promise(function (fulfill, reject) {
    console.error('a1');
    storage.init().then(function() {
      console.error('a2');
      storage.init().then(function() {
        console.error('a3');
        storage.setItem(name, status).then(function () {
          console.error('a4');
          storage.getItem(name).then(function (item) {
            console.error('a5', item);
            fulfill(item);
          }).catch(function() {reject('Storage Error A');});
        }).catch(function () {reject('Storage Error B');});
      }).catch(function() {
        reject('Storage Error');
      });
    });
  });
};

module.exports = function (list, name, customStatusFunction) {
  var generateTask = function (status) {
    return {
      'name': 'Report status: ' + status,
      'task': customStatusFunction || statusFunction,
      params: [status, name]
    };
  };

  var newList = [];
  newList.push(generateTask('Started'));
  list.map(function (task, i) {
    newList.push(generateTask('Running Task ' + (i + 1) + '/' + list.length + ' (' + task.name + ')'));
    newList.push(task);
  });
  newList.push(generateTask('Complete'));
  return newList;
};
