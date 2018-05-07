const config = require('../config');
const WatcherService = require('commons').WatcherService;
const User = require('commons').User;


let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

watcherService.batchInsert(User, [{ screen_name: 'clegislativomx', credentials: config.twitter, is_being_setup: true }]);

// watcherService.findUsers({}, 10, {}).then(users => {
//   users.forEach(user => console.log(user.screen_name));
// })
