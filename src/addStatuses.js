var datawrap = require('datawrap'),
  fs = require('fs');

fs = datawrap.Bluebird.promisifyAll(fs);

var statusFunction = function(status, name) {
  return datawrap.Bluebird(function(fulfill) {
    console.log(status, name);
    fulfill();
  });
};

module.exports = function(list, name, customStatusFunction) {
  var generateTask = function(status) {

    return {
      'name': 'Report status: ' + status,
      'task': customStatusFunction || statusFunction,
      params: [status, name]
    };
  };

  var newList = [];
  newList.push(generateTask('Started'));
  list.map(function(task, i) {
    newList.push(generateTask('Running Task ' + (i + 1) + '/' + list.length + ' (' + task.name + ')'));
    newList.push(task);
  });
  newList.push(generateTask('Complete'));
  return newList;
};
