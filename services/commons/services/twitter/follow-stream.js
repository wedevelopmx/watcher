const Twit = require('twit');

class Stream  extends Twit {
  constructor(credentials) {
    super(credentials);
  }

  checkFollowers(screenName, cursor) {
    return new Promise((resolve, reject) => {
      console.log(`>> Fetching ${screenName} @${cursor}`)
      this.get('followers/ids', { screen_name: screenName, cursor: cursor, count: 5000 }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }

  checkFriends(screenName, cursor) {
    return new Promise((resolve, reject) => {
      console.log(`>> Fetching ${screenName} @${cursor}`)
      this.get('friends/ids', { screen_name: screenName, cursor: cursor, count: 5000 }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }

  fetchFollowers(screenName, cursor) {
    return new Promise((resolve, reject) => {
      console.log(`>> Fetching ${screenName} @${cursor}`)
      this.get('followers/list', { screen_name: screenName, cursor: cursor, count: 200 }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }

  fetchFriends(screenName, cursor) {
    return new Promise((resolve, reject) => {
      console.log(`>> Fetching ${screenName} @${cursor}`)
      this.get('friends/list', { screen_name: screenName, cursor: cursor, count: 200 }, (err, data, response) => {
        if(err) reject(err);
        resolve(data)
      });
    });
  }

  lookup(ids) {
    return new Promise((resolve, reject) => {
      console.log(`>> Lookup ${ids.length} leads`)
      this.get('users/lookup', { user_id: ids }, (err, data, response) => {
        if(err) reject(err);
        resolve(data);
      });
    })
  }
}

module.exports = Stream;
