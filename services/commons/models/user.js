
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a User
var User = new Schema({
  screen_name: String,
  credentials: {
    consumer_key: String,
    consumer_secret: String,
    access_token: String,
    access_token_secret: String,
    timeout_ms: Number
  },
  import_next_cursor: { type: Number, default: -1},
  friend_next_cursor: { type: Number, default: -1}
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', User);

// make this available to our users in our Node applications
module.exports = User;
