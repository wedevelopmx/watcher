const log4js = require('log4js');
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const Unfollower = require('commons').Unfollower;
const Lead = require('commons').Lead;

function follow(user, lead) {
  return new Promise((resolve, reject) => {
    let unfollower = new Unfollower(user.credentials);
    // Unfollow
    unfollower.follow(lead.screen_name)
    .then(() => {
      logger.debug(`Follow ${lead.screen_name} [${lead.followers_count}]`);
      // Update
      lead.targeted_on = new Date();
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
        followers_count: { $gte: 100, $lte: 1000 },
        targeted_on: {$exists: true},
        'stats.rt': { $lt: 90 },
        received_at: { $gte: new Date(Date.now() - (60 * 60000)), $lt: new Date(Date.now() - (3 * 60000)) },
        $or: [{adquired_on: { $exists: false}}, {cleared_on: { $exists: true }} ]
        },
        10, 0,
        { targeted_on: -1 }
      ).then(leads => {
        logger.debug(`Found ${leads.length} leads`)
        if(leads.length > 0) {
          let chosenOne = leads[0];
          leads.forEach(lead => {
            // logger.debug(`${lead.screen_name} [${lead.followers_count}]`);
            if(chosenOne.followers_count < lead.followers_count)
              chosenOne = lead;
          });
          logger.debug(`>> ${chosenOne.screen_name} [${chosenOne.followers_count}]`);
          resolve(follow(user, chosenOne));
        } else {
          reject();
        }
      })
      .catch(err => reject(err));
  });
}

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let logger = log4js.getLogger();
logger.level = 'debug';
logger.debug('Running Follow cronjob');

// Fetch All users
watcherService.findUsers({}, 100)
.then(users => {
  logger.debug(`Found ${users.length} users`);
  let promises = users.map(user => processUser(user) );

  Promise.all(promises)
  .then(watcherService.close)
  .catch(watcherService.close);

})
.catch(err => logger.debug(err));
