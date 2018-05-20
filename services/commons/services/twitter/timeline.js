const Twit = require('twit');

class Timeline extends Twit {
  constructor(credentials) {
    super(credentials);
  }
  
  fetchTimeline(screen_name, since) {
      let filter = { screen_name: screen_name, since_id: since, count: 200, include_rts: true, exclude_replies: false };
      return new Promise((resolve, reject) => {
        this.get('statuses/user_timeline', filter, (err, data, response) => {
          if(err) reject(err);
          resolve(data);
        });
      });
  }
}

module.exports = Timeline;
