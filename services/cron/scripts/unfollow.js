const config = require('../config');
const WatcherService = require('commons').WatcherService;
const Unfollower = require('commons').Unfollower;
const Lead = require('commons').Lead;

function updateLead(lead) {
  lead.cleared_on = new Date();
  Lead.findOneAndUpdate({ id: lead.id, owner: lead.owner }, lead, { upsert: false }, function(err, result) {
    if(err) console.log(err);
    console.log(`>> Updated ${lead.screen_name}`);
    watcherService.close();
  });
}

function processUser(user) {
  console.log(`>> Processing user ${user.screen_name}`);
  // Find a lead who has been adquired, not cleared nor activated
  watcherService.findLeads({ adquired_on: {$exists: true}, cleared_on: {$exists: false}, activated_on: {$exists: false}}, 1, 0, { adquired_on: 1, followers_count: 1}).then(leads => {
      if(leads.length > 0) {
        let unfollower = new Unfollower(user.credentials);
        leads.forEach(lead => {
          unfollower.unfollow(lead.screen_name).then(() => {
            console.log(`>> Unfollow ${lead.screen_name} [${lead.followers_count}]`);
            updateLead(lead);
          });
        })
      }
  });
}

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

watcherService.findUsers({}, 100).then(users => {
  console.log(`>> Found ${users.length} users`);
  users.forEach(processUser)
;});