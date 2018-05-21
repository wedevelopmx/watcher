const config = require('../config');
const WatcherService = require('commons').WatcherService;
const TwitMessenger = require('commons').TwitMessenger;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let now = Date.now();
let delay = 5 * 60000;

function inspect(user) {
  console.log(`>> User ${user.screen_name}`);
  watcherService.findLeadAndCount({
    owner: user.screen_name,
    // Activated in the last 20 min except latest 5min 
    activated_on: {$gt: new Date(now - (4 * delay)), $lt : new Date(now - delay) }
  }, 50, 0, {}).then(result => {
    console.log(`>> We need to send ${result.leads.length} dms`)
    // Create Stream
    let messenger = new TwitMessenger(user.credentials);
    result.leads.forEach(lead => {
        let recipentId = lead.id;
        // let recipentId = user.twitter.id
        console.log(`>> Attempt sending message to @${lead.screen_name} `);
        messenger
          .directMessage(recipentId, user.welcome)
          .then(result => {
              console.log(`>> Message sent to @${lead.screen_name} [${recipentId}]`)
              lead.greeting_sent = true;
              lead.save();
          })
          .catch(err => {
            messenger
              .directMessage(user.twitter.id, `Dude, no le pudimos enviar mensaje a @${lead.screen_name}, te lo encargamos please`);
          });
    });
  });
}

console.log(new Date());
// Fetch All users
watcherService.findUsers({}, 100, {}).then(users => {
  console.log(`>> Users ${users.length}`);
  users.forEach(inspect);
});