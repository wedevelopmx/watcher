const Twit = require('twit');

class Unfollower extends Twit {
  constructor(credentials) {
    super(credentials);
  }
  
  unfollow(screen_name) {
    return new Promise((resolve, reject) => {
      this.post('friendships/destroy', { screen_name: screen_name }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }
}

module.exports = Unfollower;