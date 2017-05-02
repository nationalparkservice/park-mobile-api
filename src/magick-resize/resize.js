/* globals require process */

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    d: 'dpi',
    f: 'file',
    h: 'height',
    m: 'mask',
    o: 'output',
    q: 'quality',
    t: 'type',
    u: 'url',
    w: 'width'
  }
});
var magickResize = require('./index');

magickResize(argv, function (e, r) {
  console.log(e, r);
});
