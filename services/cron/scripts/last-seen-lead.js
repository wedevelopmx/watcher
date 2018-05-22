const log4js = require('log4js');
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FollowStream = require('commons').FollowStream;
const Lead = require('commons').Lead;

function inspect(user) {
  return new Promise((resolve, reject) => {
    let stream = new FollowStream(user.credentials);
    // Check current followers
    stream.checkFollowers(user.screen_name, -1).then(result => {
      console.log(`>> Found ${result.ids.length}`);
      Lead.update({ id: { $in: result.ids}, owner: user.screen_name}, { last_seen_on: new Date()}, { multi: true }, (err, raw) => {
        if(err) reject(err);
        console.log(`>> Requested ${raw.n} updated ${raw.nModified}`);
        resolve(raw);
      });
    });
  });
}

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let logger = log4js.getLogger();
logger.level = 'debug';
logger.debug('Running Last Seen cronjob');

// Get all new users
watcherService.findUsers({}, 100, {}).then(users => { // is_being_setup: true
  logger.debug(`Users found ${users.length}`)
  // Create a stream for each new user
  let promises = users.map(user => inspect(user));
  Promise.all(promises)
    .then(watcherService.close)
    .catch(watcherService.close);
});