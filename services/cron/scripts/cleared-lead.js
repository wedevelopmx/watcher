const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FollowStream = require('commons').FollowStream;
const Lead = require('commons').Lead;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

// Get all new users
watcherService.findUsers({import_next_cursor : { $eq: 0 }, friend_next_cursor : { $eq: 0 }}, 100, {}).then(users => { // is_being_setup: true
  // Create a stream for each new user
  users.forEach(user => {
    let stream = new FollowStream(user.credentials);

    stream.checkFriends(user.screen_name, -1).then(result => {
      console.log(`>> Found ${result.ids.length}`);
      Lead.update({ id: { $nin: result.ids}, owner: user.screen_name, adquired_on: { $exists: true }, activated_on: { $exists: false } }, { cleared_on: new Date() }, { multi: true }, (err, raw) => {
        if(err) console.log(err);
        console.log(`>> Requested ${raw.n} updated ${raw.nModified}`);
        watcherService.close();
      });
    })

  });
})
