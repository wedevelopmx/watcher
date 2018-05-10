const config = require('./config');
const amqp = require('amqplib/callback_api');
const WatcherService = require('commons').WatcherService;
const LeadStream = require('commons').LeadStream;
const q = { friend: 'friend', unfriend: 'unfriend', lead: 'lead' }

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

class Producer {
  constructor(user, ch) {
    console.log(`>> Creating producer for ${user.screen_name}`);
    this.userName = user.screen_name;
    this.ch = ch;
    // Stream
    this.stream = new LeadStream(user.credentials);
    this.stream.on('follow', this.follow.bind(this));
    this.stream.on('unfollow', this.unfollow.bind(this));
    this.stream.start();
  }

  follow(message) {
    if(this.userName === message.source.screen_name) {
      console.log(` FOLLOW ${message.target.screen_name}`)
      message.target.owner = this.userName;
      message.target.received_at = new Date();
      // We send a friend request
      this.ch.sendToQueue(q.friend, new Buffer(JSON.stringify(message.target)));
    } else {
      console.log(` FOLLOWBACK ${message.source.screen_name}`)
      message.source.owner = this.userName;
      message.source.received_at = new Date();
      // We receive a new friend
      this.ch.sendToQueue(q.lead, new Buffer(JSON.stringify(message.source)));
    }
  }

  unfollow(message) {
    if(this.userName === message.source.screen_name) {
      console.log(` UNFOLLOW ${message.target.screen_name}`)
      message.target.owner = this.userName;
      message.target.received_at = new Date();
      // We unfollow someone
      this.ch.sendToQueue(q.unfriend, new Buffer(JSON.stringify(message.target)));
    } else {
      console.log(message.source.screen_name);
      // This scenario does not exist
    }
  }

}

// Monitor messages to our steam service
const uri = 'amqp://rabbitmq:rabbitmq@rabbit/';

amqp.connect(uri, function(err, conn) {
  if(err) {
     console.log(err)
  } else {
    console.log(`>> Rabbit connected`);
    conn.createChannel(function(err, ch) {
      console.log(`>> Channel up`);
      ch.assertQueue(q.friend, {durable: false});
      ch.assertQueue(q.unfriend, {durable: false});
      ch.assertQueue(q.lead, {durable: false});

      // We will just produce here!!!
      console.log(`>> Kicking up service`);
      // Find all platform users
      watcherService.findUsers({}).then(users => {
        console.log(`>> User found ${users.length}`);
        // Turn on stream for each user
        users.forEach(user => new Producer(user, ch));
      });
    });
  }
});
