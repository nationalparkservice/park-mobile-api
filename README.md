# places-mobile-api

A set of service endpoints to support the National Park Service's Places Mobile system.

## Setting up a new park

1. Use Places Mobile Editor to create a new park
2. Generate the initial app.json, app.min.json, meta.json, and meta.min.json files: http://10.147.153.192:3000/api/generate/json/UNITCODE

# Places Website Deploy

## Basics
* The places-mobile-api is deployed via git and npm install
* It is run using a node.js task runner called [forever.js](https://github.com/foreverjs/forever).
* Forever is run as a service using a tool called [forever-service](https://github.com/zapty/forever-service)
* The api runs on the places ubuntu server under the npmap user.

### Install
```
npm install -g forever
npm install -g forever-service
git clone https://github.com/nationalparkservice/places-mobile-api.git
cd ./places-mobile-api
npm install
sudo forever-service install places-mobile-api --script app.js
```

### Using Forever, restarting the service
```
Commands to interact with service places-mobile-api
Start   - "sudo start places-mobile-api"
Stop    - "sudo stop places-mobile-api"
Status  - "sudo status places-mobile-api"
Restart - "sudo restart places-mobile-api"
```

### Mounting external drives
To mount external drives, use [this guide](https://wiki.ubuntu.com/MountWindowsSharesPermanently)

#### Note:
"restart service" command works like stop in Ubuntu due to bug in upstart https://bugs.launchpad.net/upstart/+bug/703800

To get around this run the command:

```sudo stop places-mobile-api && sudo start places-mobile-api```

## Error Logs
* The places-mobile-api project uses a multi-transport async logging library called [winstonjs](https://github.com/winstonjs/winston).
* The errors from places-mobile-api are reported up through the places-mobile-api (which is a container for places-mobile-api)
* The error reporting settings can be found in the [errorLogger.js file in the places-mobile-api project](https://github.com/nationalparkservice/places-mobile-api/blob/master/src/errorLogger.js).
* The files that are specied in that file can be found in the root of the places-mobile-api directory.
    * filelog-info.log
    * filelog-error.log
    * filelog-debug.log

If you're interested in watching the live stream of console.logs from the application, run the following command (use ctrl-c to stop it):

```tail -f /var/log/places-mobile-api.log```
