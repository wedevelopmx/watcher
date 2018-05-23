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

  follow(screen_name) {
    return new Promise((resolve, reject) => {
      this.post('friendships/create', { screen_name: screen_name, follow: false }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }
}

module.exports = Unfollower;
