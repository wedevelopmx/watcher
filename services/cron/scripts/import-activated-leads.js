const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FollowStream = require('commons').FollowStream;
const User = require('commons').User;
const Lead = require('commons').Lead;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

function saveNextCursor(user, result) {
  // Save next next_cursor
  user.import_next_cursor = result.next_cursor;
  user.save(err => {
    if(err) console.log(err);
    watcherService.close();
  });
}

function handleErrors(err) {
  if(err.writeErrors) {
    err.writeErrors.forEach(writeError => {
      if(writeError.code === 11000) {
        let record = writeError.toJSON().op;
        Lead.findOneAndUpdate({ id: record.id, owner: record.owner }, { $set: { activated_on: new Date(), last_seen_on: new Date() } }, { new: true, upsert: false }, (err, result) => {
          if(err) console.log(err)
          // console.log(`>> Updated ${result.id} ${result.owner} ${result.activated_on}`)
        });
      }
    });
    console.log(`>> Errors ${err.writeErrors.length}`)
  }
}

// Get all new users
watcherService.findUsers({import_next_cursor : { $ne: 0 }, friend_next_cursor : { $eq: 0 }}, 100, {}).then(users => {
  // Create a stream for each new user
  users.forEach(user => {
    let stream = new FollowStream(user.credentials);

    // Fetch next followers
    stream.fetchFollowers(user.screen_name, user.import_next_cursor)
    .then(result => {
      console.log(`>> ${user.screen_name} importing ${result.users.length} next ${result.next_cursor}`);
      let now = new Date();
      // Link to user
      result.users.forEach(lead => {
        lead.owner = user.screen_name;
        lead.last_seen_on = now;
        lead.activated_on = now;
      });
      // Save new followers
      watcherService.batchInsert(Lead, result.users)
      .then(() => {
        saveNextCursor(user, result);
      })
      .catch((err) => {
        saveNextCursor(user, result);
        handleErrors(err);
      });

    });

  });
})
