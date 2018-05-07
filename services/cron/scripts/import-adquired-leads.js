const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FollowStream = require('commons').FollowStream;
const User = require('commons').User;
const Lead = require('commons').Lead;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

function saveNextCursor(user, result) {
  // Save next next_cursor
  user.friend_next_cursor = result.next_cursor;
  user.save(err => {
    if(err) console.log(err);
    watcherService.close();
  });
}

function handleErrors(err) {
  if(err.writeErrors) {
    err.writeErrors.forEach(writeError => {
      console.log(`>> ${writeError.code} - ${writeError.errmsg}`)
      console.log(writeError.toJSON().op)
    });
    console.log(`>> Errors: ${err.writeErrors.length}`)
  }
}

// Get all new users
watcherService.findUsers({friend_next_cursor : { $ne: 0 }}, 100, {}).then(users => {
  // Create a stream for each new user
  users.forEach(user => {
    let stream = new FollowStream(user.credentials);

    // Fetch next followers
    stream.fetchFriends(user.screen_name, user.friend_next_cursor)
    .then(result => {
      console.log(`>> ${user.screen_name} importing ${result.users.length} next ${result.next_cursor}`);
      // Link to user
      result.users.forEach(lead => {
        let now = new Date();
        lead.owner = user.screen_name;
        lead.targeted_on = now;
        lead.adquired_on = now;
      });
      // Save new followers
      watcherService.batchInsert(Lead, result.users)
      .then(() => saveNextCursor(user, result))
      .catch((err) => {
        saveNextCursor(user, result);
        handleErrors(err);
      });
    });
  });
})
