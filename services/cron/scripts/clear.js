const config = require('../config');
const WatcherService = require('commons').WatcherService;
const Lead = require('commons').Lead;


let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

Lead.remove({}).then(() => {
  console.log('>> Leads clear')
})

// watcherService.findUsers({}, 10, {}).then(users => {
//   users.forEach(user => console.log(user.screen_name));
// })
