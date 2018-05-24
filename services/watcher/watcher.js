const config = require('./config');
const WatcherService = require('commons').WatcherService;
const TwittStream = require('commons').TwittStream;
const amqp = require('amqplib/callback_api');
const q = {
  tweet: 'tweet',
  target: 'target',
  listener_on: 'listener_on',
  listener_off: 'listener_off',
  listener_update: 'listener_update'
}

// Global holder
const watchers = {};

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

function kickoffStreams(ch) {
  console.log(`>> Kicking up`);
  // Find all platform users
  watcherService.findUsers({}).then(users => {
    console.log(`>> User found ${users.length}`);
    // Turn on stream for each user
    users.forEach(user => createStream(user, ch) );
  });
}

function createStream(user, ch) {
  console.log(`>> Creating stream for ${user.screen_name}`);
  watcherService.findAllTerms(user.screen_name).then(terms => {
    watchers[user.screen_name] = new Producer(user, terms, ch);
    watchers[user.screen_name].start();
  });
}

class Producer {
  constructor(user, terms, ch) {
    console.log(`>> Stream dispatched for #${terms.length} terms`);
    this.user = user;
    this.screen_name = user.screen_name;
    this.ch = ch;
    this.stream = new TwittStream(user, terms);
  }

  process(tweet) {
    console.log(`>> [${this.screen_name}] Incoming message from @${tweet.user.screen_name} ...`) //(${tweet.text})
    let now = new Date();
    // User
    tweet.user.owner = this.screen_name;
    tweet.user.received_at = now;
    // Clasify
    if(retweet.in_reply_to_status_id) {
      tweet.user.activity = 'reply';
    } else if(tweet.retweeted_status) {
      tweet.user.activity = 'retweet';
    } else if(tweet.quoted_status) {
      tweet.user.activity = 'quoted';
    } else {
      tweet.user.activity = 'tweet';
    }
    // Tweet
    tweet.source = this.screen_name;
    tweet.received_at = now;
    this.ch.sendToQueue(q.target, new Buffer(JSON.stringify(tweet.user)));
    this.ch.sendToQueue(q.tweet, new Buffer(JSON.stringify(tweet)));
  }

  stop() {
    this.stream.stop();
  }

  start() {
    this.stream.process(this.process.bind(this)).start();
  }
}

function updateStream(ch, msg) {
  let data = JSON.parse(msg.content);
  if(watchers.hasOwnProperty(data.user)) {
    console.log(`>> Requesting stream to update ${data.user} `)
    let stream = watchers[data.user];
    if(stream) {
      console.log(`>> Existent steam stoped `)
      stream.stop();
    }

    createStream(stream.user, ch);
  }
}

function bringStreamUp(msg) {
  let data = JSON.parse(msg.content);
  console.log(`>> Requesting bringing up ${data.user}`)
  if(watchers.hasOwnProperty(data.user)) {
    console.log('>> Stream found, binging up');
    watchers[data.user].start();
  }
}

function bringStreamDown(msg) {
  let data = JSON.parse(msg.content);
  console.log(`>> Requesting bringing down ${data.user}`)
  if(watchers.hasOwnProperty(data.user)) {
    console.log('>> Stream found, binging down');
    watchers[data.user].stop();
  }
}

// Monitor messages to our steam service
const uri = 'amqp://rabbitmq:rabbitmq@rabbit/';

amqp.connect(uri, function(err, conn) {
  console.log(`>> Rabbit connected`);
  conn.createChannel(function(err, ch) {
    console.log(`>> Channel up`);
    ch.assertQueue(q.tweet, {durable: false});
    ch.assertQueue(q.target, {durable: false});
    ch.assertQueue(q.listener_on, {durable: false});
    ch.assertQueue(q.listener_off, {durable: false});
    ch.assertQueue(q.listener_update, {durable: false});

    kickoffStreams(ch);

    ch.consume(q.listener_on, bringStreamUp, {noAck: true});
    ch.consume(q.listener_off, bringStreamDown, {noAck: true});
    ch.consume(q.listener_update, updateStream.bind(null, ch), {noAck: true});
  });
});
