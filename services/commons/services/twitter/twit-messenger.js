const Twit = require('twit');

class TwitMessenger extends Twit {
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

module.exports = TwitMessenger;