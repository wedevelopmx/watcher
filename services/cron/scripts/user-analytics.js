const config = require('../config');
const WatcherService = require('commons').WatcherService;
const Timeline = require('commons').Timeline;
const Lead = require('commons').Lead;

function analize(tweets) {
  let rt = 0, reply = 0, twit = 0;
  tweets.forEach(tweet => {
    // console.log(`>> ${tweet.text}`);
    if(tweet.retweeted_status) {
      rt ++;
    } else if(tweet.quoted_status) {
      reply ++;
    } else {
      twit ++;
    }
  });
  
  return {
    tw: (100*twit/tweets.length).toFixed(2),
    rt: (100*rt/tweets.length).toFixed(2),
    rp: (100*reply/tweets.length).toFixed(2)
  };
}

function processLead(stream, lead) {
  stream.fetchTimeline(lead.screen_name)
  .then(tweets => {
    lead.stats = analize(tweets);
    Lead.findOneAndUpdate({ id: lead.id, owner: lead.owner }, lead, { upsert: false }, function(err, result) {
      if(err) console.log(err);
      console.log(`>> Saving ${lead.screen_name}`);
    });
  })
}

function processUser(user) {
  let stream = new Timeline(user.credentials);
  watcherService.findLeads({ owner: user.screen_name, 'stats.tw': 0, 'stats.rt': 0, 'stats.rp': 0 }, 5).then(leads => {
    console.log(`>> Inspecting ${leads.length} leads`)
    leads.forEach(lead => processLead(stream, lead));
  });
}

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

watcherService.findUsers({}, 100).then(users => {
  console.log(`>> Found ${users.length} users`);
  users.forEach(processUser)
;});
