var config = require('../config/config');

module.exports = function() {
  // Add the environment variables in from the config file
  var configEnvs = {
    appName: process.env.API_APP_NAME,
    debug: !!process.env.APP_DEBUG_MODE,
    port: process.env.API_PORT,
    cacheBaseUrl: process.env.APP_BASE_URL,
    akamaiKey: [ //https://www.npmjs.com/package/edgegrid
      process.env.EDGERC_CLIENT_TOKEN,
      process.env.EDGERC_CLIENT_SECRET,
      process.env.EDGERC_ACCESS_TOKEN,
      process.env.EDGERC_HOST,
    ],
    database: {
      cartodb: {
        'account': process.env.CARTODB_ACCOUNT,
        'apiKey': process.env.CARTODB_API_KEY,
        'type': 'cartodb',
        'protocol': process.env.CARTODB_PROTOCOL,
        'url': process.env.CARTODB_URL
      },
      defaults: undefined
    },
    fileLocation: process.env.API_FILE_LOCATION
  };
  // Update config file with our settings
  for (var k in configEnvs) {
    config[k] = configEnvs[k];
  }
  return config;
};
