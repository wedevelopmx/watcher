const log4js = require('log4js');
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const Unfollower = require('commons').Unfollower;
const Lead = require('commons').Lead;

function unfollow(user, lead) {
  return new Promise((resolve, reject) => {
    let unfollower = new Unfollower(user.credentials);
    // Unfollow
    unfollower.unfollow(lead.screen_name)
    .then(() => {
      logger.debug(`Unfollow ${lead.screen_name} [${lead.followers_count}]`);
      // Update
      lead.cleared_on = new Date();
      Lead.findOneAndUpdate({ id: lead.id, owner: lead.owner }, lead, { upsert: false }, function(err, result) {
        if(err) reject(err);
        logger.debug(`Updated ${lead.screen_name}`);
        resolve(result);
      });
    })
    .catch(err => reject(err));
  });
}

function processUser(user) {
  return new Promise((resolve, reject) => {
    logger.debug(`Processing user ${user.screen_name}`);
    // Find a lead who has been adquired, not cleared nor activated
    watcherService.findLeads({
        owner: user.screen_name,
        adquired_on: {$exists: true},
        cleared_on: {$exists: false},
        activated_on: {$exists: false}
        },
        1, 0,
        { followers_count: 1, adquired_on: 1 }
      ).then(leads => {
        logger.debug(`Found ${leads.length} leads`)
        if(leads.length > 0) {
          resolve(unfollow(user, leads[0]));
        } else {
          reject(false);
        }
      })
      .catch(err => reject(err));
  });
}

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let logger = log4js.getLogger();
logger.level = 'debug';
logger.debug('Running DM cronjob');

// Fetch All users
watcherService.findUsers({}, 100).then(users => {
  logger.debug(`Found ${users.length} users`);
  let promises = users.map(user => processUser(user) );

  Promise.all(promises)
  .then(watcherService.close)
  .catch(watcherService.close);

;});
