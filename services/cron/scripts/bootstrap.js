const config = require('../config');
const data = require('../data/terms');
const WatcherService = require('commons').WatcherService;
const User = require('commons').User;
const Term = require('commons').Term;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let screenName = 'clegislativomx';
let terms = data.map(item => { return { owner: screenName, name: item.twitter} });

watcherService
  .batchInsert(User, [{ screen_name: screenName, credentials: config.user.credentials, twitter: config.user.twitter }])
  .then(result => {
    Term.remove({}).then(() => {
      watcherService.batchInsert(Term, terms)
      .then(result => {
        console.log(`>> Terms ${result.length}.`);
        watcherService.close();
      });
    });
  });
