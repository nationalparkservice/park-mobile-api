var getParkList = require('../getParkList');

getParkList().catch(function(e) {
  console.log('error', e);
}).then(function(r) {
  console.log('Getting all parks', r);
});

console.log('Getting one park');
getParkList('klgo').catch(function(e) {
  console.log('error', e);
}).then(function(r){
  console.log('Getting one park', r);
});

console.log('Getting multiple specific parks');
getParkList(['klgo', 'heho']).catch(function(e) {
  console.log('error', e);
}).then(function(r){
  console.log('Getting multiple specific parks', r);
});
