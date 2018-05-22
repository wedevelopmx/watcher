const log4js = require('log4js');
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const TwitMessenger = require('commons').TwitMessenger;

function dm(user, leads) {
  // Create Stream
  let messenger = new TwitMessenger(user.credentials);
  leads.forEach(lead => {
      let recipentId = lead.id;
      // let recipentId = user.twitter.id
      logger.debug(`Attempt sending message to @${lead.screen_name} `);
      messenger
        .directMessage(recipentId, user.welcome)
        .then(result => {
            logger.debug(`>> Message sent to @${lead.screen_name} [${recipentId}]`);
        })
        .catch(err => {
            logger.error(`>> Message could not be sent to @${lead.screen_name} [${recipentId}]`);
            messenger
              .directMessage(user.twitter.id, `Dude, no le pudimos enviar mensaje a @${lead.screen_name}, te lo encargamos please`);
        });
  });
}

function inspect(user) {
  return new Promise((resolve, reject) => {
    logger.debug(`Inspecting @${user.screen_name}`);
    watcherService.findLeadAndCount({
      owner: user.screen_name,
      // Activated in the last 20 min except latest 5min 
      activated_on: {$gt: new Date(now - (4 * delay)), $lt : new Date(now - delay) }
    }, 50, 0, {})
    .then(result => {
      logger.debug(`We need to send #${result.leads.length} dms`)
      dm(user, result.leads);
      resolve(true);
    })
    .catch(err => reject(err));
  });
}


let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let now = Date.now();
let delay = 5 * 60000;
let logger = log4js.getLogger();

logger.level = 'debug';
logger.debug('Running DM cronjob');

// Fetch All users
watcherService.findUsers({}, 100, {}).then(users => {
  logger.debug(`Users ${users.length}`);
  let promises = users.map( user => inspect(user));
  Promise.all(promises)
    .then(watcherService.close)
    .catch(watcherService.close);
});