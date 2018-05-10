const Twit = require('twit')

class LeadStream extends Twit {
  constructor(config) {
    super(config);
    this.stream = this.stream('user', { stringify_friend_ids: true });
  }

  start() {
    this.stream.on('follow', this.onFollow.bind(this));

    this.stream.on('unfollow', this.onUnfollow.bind(this));
  }

  on(event, fnc) {
    this.stream.on(event, fnc);
  }

  onFollow(data) {
    console.info(`>> follow @${data.source.screen_name} has FOLLOWED @${data.target.screen_name}`)
  }

  onUnfollow(data) {
    console.info(`>> unfollow @${data.source.screen_name} has UNFOLLOWED @${data.target.screen_name}`)
  }

}

module.exports = LeadStream;
