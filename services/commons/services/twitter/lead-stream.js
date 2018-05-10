const Twit = require('twit')

class LeadStream extends Twit {
  constructor(config) {
    super(config);
    this.stream('user', { stringify_friend_ids: true });
  }

  start() {
    this.on('follow', this.onFollow.bind(this));

    this.on('unfollow', this.onUnfollow.bind(this));
  }

  onFollow(data) {
    console.info(`>> follow @${data.source.screen_name} has FOLLOWED @${data.target.screen_name}`)
  }

  onUnfollow(data) {
    console.info(`>> unfollow @${data.source.screen_name} has UNFOLLOWED @${data.target.screen_name}`)
  }

}

module.exports = LeadStream;
