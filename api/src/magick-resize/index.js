/* global require, __dirname */

var download = require('./src/download.js');
var tasks = require('./src/tasks.js');

var makeAlias = function (input, params) {
  var output = {};
  var aliases = params.alias;
  for (var alias in aliases) {
    if (input[alias] || input[aliases[alias]]) {
      output[alias] = input[alias] || input[aliases[alias]];
      output[aliases[alias]] = input[alias] || input[aliases[alias]];
    }
  }
  return output;
};

var argAlias = {
  d: 'dpi',
  e: 'extension',
  f: 'file',
  h: 'height',
  o: 'output',
  m: 'mask',
  q: 'quality',
  t: 'type',
  u: 'url',
  w: 'width'
};


module.exports = function (args, mainCallback) {
  // Read aliases into the config
  var argv = makeAlias(args, {
    alias: argAlias
  });
  // Create a random number as an ID
  var id = Math.floor((Math.random() * 10000000000000) + 1).toString();
  var params, temp;

  params = tasks.readParams(argv);
  temp = {
    'resize': __dirname + '/tmp/resize_' + id + params.extension,
    'mask': __dirname + '/tmp/mask_' + id + params.extension,
    'download': __dirname + '/tmp/download_' + id + params.extension
  };
  if (params.url) {
    // Download the file
    console.log('Downloading:', params.url);
    download(params.url, temp.download, function (error) {
      if (!error) {
        params.file = temp.download;
        temp.downloaded = true;
        tasks.runParams(params, temp, mainCallback);
      } else {
        mainCallback(error);
      }
    }, false, 2);
  } else {
    // If there's no url, just run the params
    tasks.runParams(params, temp, mainCallback);
  }
};
