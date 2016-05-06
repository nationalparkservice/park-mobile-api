var Promise = require('bluebird');
var fandlebars = require('fandlebars');
Promise.config({
  'longStackTraces': true
});

var applyParams = function (params, tasks, results) {
  var resultObj = {};
  tasks.forEach(function (task, i) {
    if (results.length > i && task.name) {
      resultObj[task.name] = results[i];
    }
  });

  return params.map(function (param) {
    var returnValue = param;
    if (typeof param === 'string' && param.match(/^\{\{.+?\}\}/g)) {
      returnValue = fandlebars(param, resultObj, null, true)[param];
    }
    return returnValue;
  });
};

var reporter = function (verbose) {
  var fn = function () {};
  if (verbose) {
    fn = typeof verbose === 'function' ? verbose : console.log;
  }
  return function () {
    fn.apply(this, arguments);
  };
};

module.exports = function (list, taskName, verbose, errorArray) {
  var messages = [];
  messages._iterateTasksStats = [];
  var report = reporter(verbose);
  return new Promise(function (listResolve, listReject) {
    var exec = function (sublist, msgList, callback) {
      var nextList = [];
      var params = Array.isArray(sublist[0].params) ? sublist[0].params : [sublist[0].params];
      params = applyParams(params, list, msgList);
      report('*** Executing "' + taskName + '" Task ***\n\t', sublist[0].name);

      var taskResObj = {};
      var task = applyParams([sublist[0].task], list, msgList)[0];
      try {
        var taskRes = task.apply(
          sublist[0].context,
          params
        );
        if (taskRes && taskRes.then && typeof taskRes.then === 'function' && taskRes.catch && typeof taskRes.catch === 'function') {
          // This is a bluebird function
          taskResObj = taskRes;
        } else {
          // it's an imposter!
          taskResObj.then = taskRes && taskRes.then || function (thenFn) {
            thenFn(taskRes);
            return taskResObj;
          };
          taskResObj.catch = taskRes && taskRes.catch || function (catchFn) {
            return taskResObj;
          };
        }
      } catch (e) {
        taskResObj.then = function (catchFn) {
          return taskResObj;
        };
        taskResObj.catch = function (catchFn) {
          e.message = '[' + sublist[0].name + '] ' + e.message;
          catchFn(e);
          return taskResObj;
        };
      }
      var start = new Date().getTime();
      taskResObj.then(function (msg) {
        var end = new Date().getTime();
        messages.push(msg);
        if (sublist[0].name && parseInt(sublist[0].name, 10).toString() !== sublist[0].name.toString()) {
          messages[sublist[0].name.toString()] = msg;
        }
        messages._iterateTasksStats.push((end - start) + 'ms');
        nextList = sublist.slice(1);
        if (nextList.length > 0) {
          exec(nextList, messages, callback);
        } else {
          callback(null, messages);
        }
      })
        .catch(function (e) {
          messages.push(e);
          callback(messages);
        });
    };

    if (list.length > 0) {
      // TODO: This can cause stack overflows, come up with a better way to run this
      // It might require some cool trickery with Promise.all on some functions
      exec(list, messages, function (e, r) {
        var resolveValue;
        if (e) {
          resolveValue = errorArray ? e : e[e.length - 1];
          resolveValue.taskName = taskName;
          listReject(resolveValue);
        } else {
          listResolve(r);
        }
      });
    } else {
      listResolve({});
    }
  });
};
