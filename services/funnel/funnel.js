const config = require('./config');
const amqp = require('amqplib/callback_api');

const Lead = require('commons').Lead;
const WatcherService = require('commons').WatcherService;
const q = { friend: 'friend', unfriend: 'unfriend', lead: 'lead', tweet: 'tweet', target: 'target' }

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

function save(lead) {
  // Find the document
  Lead.findOneAndUpdate({ id: lead.id, owner: lead.owner }, lead, { upsert: false }, function(error, result) {
    if (!error) {
      // If the document doesn't exist
      if (!result) {
        // Create it
        result = new Lead(lead);
        // Save the document
        result.save(function(error) {
            if (!error) {
                console.log(`     Saved ${result.screen_name}`)
            } else {
                throw error;
            }
        });
      }
    }
  });
}

function target(msg) {
  let payload = JSON.parse(msg.content.toString());
  console.log(` [X] Targeted ${payload.screen_name}`);
  // Targeted
  payload.targeted_on = new Date();
  save(payload);
}

function friend(msg) {
  let payload = JSON.parse(msg.content.toString());
  console.log(` [X] Adquired ${payload.screen_name}`);
  // Adquired
  payload.adquired_on = new Date();
  save(payload);
}

function unfriend(msg) {
  let payload = JSON.parse(msg.content.toString());
  console.log(` [X] Cleared ${payload.screen_name}`);
  // Cleared
  payload.cleared_on = new Date();
  save(payload);
}

function lead(msg) {
  let payload = JSON.parse(msg.content.toString());
  console.log(` [X] Activated ${payload.screen_name}`);
  // Acived
  payload.actived_on = new Date();
  save(payload);
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
      ch.assertQueue(q.target, {durable: false});

      ch.consume(q.friend, friend, {noAck: true});
      ch.consume(q.unfriend, unfriend, {noAck: true});
      ch.consume(q.lead, lead, {noAck: true});
      ch.consume(q.target, target, {noAck: true});
    });
  }
});