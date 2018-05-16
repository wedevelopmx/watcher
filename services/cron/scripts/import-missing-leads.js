const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FollowStream = require('commons').FollowStream;
const User = require('commons').User;
const Lead = require('commons').Lead;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

function handleErrors(err) {
  if(err.writeErrors) {
    err.writeErrors.forEach(writeError => {
      if(writeError.code === 11000) {
        let record = writeError.toJSON().op;
        console.log(`>> ${writeError.code} ${writeError.errmsg}`);
      }
    });
    console.log(`>> Errors ${err.writeErrors.length}`)
  }
}

function findAndUpdateMissing(stream, missing, screenName) {
  // Lookup for missing leads
  stream.lookup(missing)
  .then(users => {
    console.log(`>> Found #${users.length}`);
    let now = new Date();
    let ids = users.map(user => user.id);
    let notFound = missing.filter(m => !ids.includes(m))

    // // Push missing
    // notFound.forEach(id => {
    //   users.push({
    //     id: id,
    //     id_str: `${id}`,
    //     owner: screenName,
    //     activated_on: now
    //   });
    // });

    users.forEach(newUser => {
      newUser.owner = screenName;
      newUser.targeted_on = now;
      newUser.adquired_on = now;
      newUser.activated_on = now;
    });

    // console.log(users);

    // Save new followers
    watcherService.batchInsert(Lead, users).then(docs =>{
      // Save next next_cursor
      console.log(`>> Inserted ${docs.length}`);
    })
    .catch(err => {
      handleErrors(err);
    });
  });
}

function setupUser(user) {
  let stream = new FollowStream(user.credentials);
  // Bring all followers IDs
  stream.checkFollowers(user.screen_name, -1).then(followers => { // user.setup_next_cursor
    // Bring all leads
    watcherService.findLeads({ activated_on: { $exists: true }, screen_name: { $exists: true} }, 1000)
    .then( leads => {
        console.log(`>> ${followers.ids.length} v. ${leads.length}`);

        let ids = leads.map(lead => lead.id);
        let missing = followers.ids.filter(id => !ids.includes(id));
        console.log(missing);

        if(missing.length > 0) {
            findAndUpdateMissing(stream, missing, user.screen_name);
        }
    });

  });
}

// Get all new users
watcherService.findUsers({import_next_cursor : { $eq: 0 }, friend_next_cursor : { $eq: 0 }}, 100, {}).then(users => { // is_being_setup: true
  // Create a stream for each new user
  users.forEach(setupUser);
})
