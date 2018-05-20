const Twit = require('twit');
const config = require('../config');

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



let stream = new Timeline(config.user.credentials);

stream.fetchTimeline('srrobo').then(tweets => {
  let rt = 0, reply = 0, twit = 0;
  tweets.forEach(tweet => {
    // console.log(`>> ${tweet.text}`);
    if(tweet.retweeted_status) {
      rt ++;
    } else if(tweet.quoted_status) {
      reply ++;
    } else {
      twit ++;
    }
  });
  
  console.log(`>> T:${ (100*twit/tweets.length).toFixed(2) }% RT:${ (100*rt/tweets.length).toFixed(2) }% R:${ (100*reply/tweets.length).toFixed(2) }% `)
})