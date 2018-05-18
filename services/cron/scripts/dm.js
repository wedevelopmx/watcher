const config = require('../config');
const Twit = require('twit');
const WatcherService = require('commons').WatcherService;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

let now = Date.now();
let delay = 15 * 60000;

class Messenger extends Twit {
  constructor(config) {
    super(config);
  }
  
  directMessage(recipent, text) {
    let event = {
      type: 'message_create',
      message_create: {
        target: {
          recipient_id: recipent
        },
        message_data: {
          text: text
        }
      }
    };
    let _self = this;
    return new Promise((resolve, reject) => {
      _self.post('direct_messages/events/new', { event: event }, (err, data, response) => {
        if(data.errors) {
          reject(data);
        } else {
          resolve(data);
        }
      });
    });
  }
}

function inspect(user) {
  console.log(`>> User ${user.screen_name}`);
  watcherService.findLeadAndCount({
    owner: user.screen_name,
    activated_on: {$gt: new Date(now - (2 * delay)), $lt : new Date(now - delay) }
  }, 1, 0, {}).then(result => {
    console.log(`>> We need to send ${result.leads.length} dms`)
    // Create Stream
    let messenger = new Messenger(user.credentials);
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