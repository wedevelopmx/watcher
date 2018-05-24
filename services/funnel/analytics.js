const config = require('./config');
const amqp = require('amqplib/callback_api');

const Lead = require('commons').Lead;
const WatcherService = require('commons').WatcherService;
const Timeline = require('commons').Timeline;
const q = { analytics: 'analytics' };

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let timelines = {};

function analize(tweets) {
  let rt = 0, reply = 0, twit = 0, quote = 0;
  tweets.forEach(tweet => {
    // console.log(`>> ${tweet.text}`);
    if(retweet.in_reply_to_status_id) {
      reply++;
    } else if(tweet.retweeted_status) {
      rt ++;
    } else if(tweet.quoted_status) {
      quote ++;
    } else {
      twit ++;
    }
  });

  return {
    tw: (100*twit/tweets.length).toFixed(2),
    rt: (100*rt/tweets.length).toFixed(2),
    rp: (100*reply/tweets.length).toFixed(2)
    qt: (100*quote/tweets.length).toFixed(2)
  };
}

function analytics(msg) {
  let payload = JSON.parse(msg.content.toString());
  console.log(` [X] Analytics ${payload.screen_name} requested by ${payload.owner}`);
  let timeline = timelines[payload.owner];
  if(timeline) {
    timeline.fetchTimeline(payload.screen_name).then(tweets => {
      payload.stats = analize(tweets);
      Lead.findOneAndUpdate({ id: payload.id, owner: payload.owner }, payload, { upsert: false }, function(err, result) {
        if(err) console.log(err);
      });
    })
    .catch(err => console.log(err));
  }
}

watcherService.findUsers({}, 100).then(users => {
  console.log(`>> Creating timelines for ${users.length}`)
  users.forEach(user => {
    timelines[user.screen_name] = new Timeline(user.credentials);
  });

  // Monitor messages to our steam service
  const uri = 'amqp://rabbitmq:rabbitmq@rabbit/';

  amqp.connect(uri, function(err, conn) {
    if(err) {
       console.log(err)
    } else {
      console.log(`>> Rabbit connected`);
      conn.createChannel(function(err, ch) {
        console.log(`>> Channel up`);
        ch.assertQueue(q.analytics, {durable: false});

        ch.consume(q.analytics, analytics, {noAck: true});
      });
    }
  });

});
