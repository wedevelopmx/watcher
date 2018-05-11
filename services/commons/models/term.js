// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a Tweet
var TermSchema = new Schema({
  owner: { type: String, required : true, dropDups: true },
  name: { type: String, required : true, dropDups: true },
  tw: { type: Number, default: 0 },
  rt: { type: Number, default: 0 },
  monitor: { type: Boolean, default: true }
});

TermSchema.index({ owner: 1, name: -1 }, {unique: true}); // schema level

// the schema is useless so far
// we need to create a model using it
var Term = mongoose.model('Term', TermSchema);

// make this available to our users in our Node applications
module.exports = Term;
