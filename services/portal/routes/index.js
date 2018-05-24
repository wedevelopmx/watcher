const moment = require('moment');
const express = require('express');
const router = express.Router();
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const FunnelService = require('commons').FunnelService;
const WatcherPipe = require('commons').WatcherPipe;
const Term = require('commons').Term;
const User = require('commons').User;

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
const funnelService = new FunnelService(config.mongo.uri, config.mongo.options);
const watcherPipe = new WatcherPipe();

module.exports = function(app, passport) {
  const utils = { moment: moment, bg: bg, money: money };

  // define the home page route
  app.get('/', function (req, res) {
    res.render('index')
  })

  // define the about route
  app.get('/dashboard', isLoggedIn, function (req, res) {
    let userName = req.user.screen_name;
    Promise.all([
      funnelService.getTargetStats(userName),
      funnelService.getProspectStats(userName),
      funnelService.getAdquiredStats(userName),
      funnelService.getActivatedStats(userName)
    ]).then(results => {
      res.render('dashboard', {
        user: req.user,
        stats: {
          target: results[0],
          prospect: results[1],
          adquired: results[2],
          activated: results[3]
        }
      });
    }).catch(err => console.log(err));
  });

  app.get('/direct-message', isLoggedIn, function (req, res) {
    User.findById(req.user._id).then(user => {
      res.render('direct-message', {
        user: user
      });
    });
  });

  app.post('/direct-message', isLoggedIn, function (req, res) {
    User.findOneAndUpdate({_id: req.user._id }, { $set: { welcome: req.body.welcome }}, {new: true}, function(err, doc){
        if(err) res.redirect('/direct-message?error');
        res.redirect('/direct-message?success');
    });
  });

  app.get('/integration', isLoggedIn, function (req, res) {
    User.findById(req.user._id).then(user => {
      res.render('integration', {
        user: user
      });
    });
  });

  app.post('/integration', isLoggedIn, function (req, res) {

    User.findOneAndUpdate({_id: req.user._id }, { $set: { credentials: req.body }}, {new: true}, function(err, doc){
        if(err) res.redirect('/integration?error');
        res.redirect('/integration?success');
    });
  });

  app.get('/terms', isLoggedIn, function (req, res) {
    watcherService.findAllTerms(req.user.twitter.username).then(result => {
      res.render('terms', {
        user: req.user,
        terms: result
      });
    });
  });

  app.post('/terms', isLoggedIn, function (req, res) {
    console.log(`>> Terms ${req.body.term.length}`);

    watcherService.batchUpdate(Term, { _id: { $in: req.body.term }}, { monitor: true }).then(() => {
      watcherService.batchUpdate(Term, { _id: { $nin: req.body.term }}, { monitor: false }).then(() => {
        watcherService.findAllTerms(req.user.twitter.username).then(result => {
          res.render('terms', {
            user: req.user,
            terms: result
          });

          watcherPipe.listenerUpdate(req.user.twitter.username);
        });
      });
    });
  });

  app.get('/deactivated', isLoggedIn, function (req, res) {
    let field = 'cleared_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;
    let now = today();

    watcherService
    .findLeadAndCount({ owner: userName, targeted_on: { $exists: true }, cleared_on: { $exists: true } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', Object.assign({
        user: req.user,
        accounts: result.leads,
        count: result.count,
        resource: 'deactivated',
        date: {
          display: 'Unfollow',
          field: field
        },
        events: 'cleared_events',
        utils: utils
      }, page));
    });
  });

  app.get('/activated', isLoggedIn, function (req, res) {
    let field = 'activated_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;
    let now = today();

    // last_seen_on: { $gte: now }
    watcherService
    .findLeadAndCount({ owner: userName, activated_on: { $exists: true}, last_seen_on: { $gte: now } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', Object.assign({
        user: req.user,
        accounts: result.leads,
        count: result.count,
        resource: 'Activated',
        date: {
          display: 'activated',
          field: field
        },
        events: 'activated_events',
        utils: utils
      }, page));
    });
  });

  app.get('/adquired', isLoggedIn, function (req, res) {
    let field = 'adquired_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;
    let now = today();

    watcherService
    .findLeadAndCount({ owner: userName, adquired_on: { $exists: true }, cleared_on: { $exists: false } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', Object.assign({
        user: req.user,
        accounts: result.leads,
        count: result.count,
        resource: 'adquired',
        date: {
          display: 'Adquired',
          field: field
        },
        events: 'adquired_events',
        utils: utils
      }, page));
    });
  });

  app.get('/target', isLoggedIn, function (req, res) {
    let field = 'targeted_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;

    watcherService
    .findLeadAndCount({
      owner: userName,
      followers_count: { $gte: page.filter.min_followers_count, $lte: page.filter.max_followers_count },
      targeted_on: {$exists: true},
      received_at: { $lt: new Date(Date.now() - (page.delay * 60000)) },
      'stats.rt': { $lt: page.rt },
      $or: [{adquired_on: { $exists: false}}, {cleared_on: { $exists: true }} ]
    }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', Object.assign({
        user: req.user,
        accounts: result.leads,
        count: result.count,
        resource: 'target',
        date: {
          display: 'Target',
          field: field
        },
        events: 'targeted_events',
        utils: utils
      }, page));
    });
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/auth/twitter', passport.authenticate('twitter'));

  // handle the callback after twitter has authenticated the user
  app.get('/auth/twitter/callback',
      passport.authenticate('twitter', {
          successRedirect : '/dashboard',
          failureRedirect : '/'
      }));

}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function today() {
  return new Date(Date.now() - 3600000);
}

function pageable(req, defaultSort) {
  let sort = {};
  let asc = req.query.asc && req.query.asc == 'true' ? true : false;
  let sortBy = req.query.sort || defaultSort ||'followers_count';
  let rt = req.query.rt || 90;
  let delay = isNaN(req.query.delay) ? 2 : parseInt(req.query.delay);
  let min_followers_count = req.query.min_followers_count || 100;
  let max_followers_count = req.query.max_followers_count || 1500;
  sort[sortBy] = asc ? 1 : -1;

  return {
    size: parseInt(req.query.size || 10),
    offset: parseInt(req.query.offset || 0),
    filter: {
      max_followers_count: max_followers_count,
      min_followers_count: min_followers_count
    },
    sortBy: sortBy,
    sort: sort,
    asc: asc,
    delay: delay,
    rt: rt
  }
}

function bg(number) {
  number = parseInt(number);
  if(number > 2000) {
    return 'text-white badge badge-danger';
  } else if(number > 1000) {
    return 'text-white badge badge-warning';
  } else if(number > 100) {
    return 'text-white badge badge-success';
  } else {
    return 'text-white badge badge-secondary';
  }
}

function money(number) {
  if(number)
    return number.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,');
  return "?";
}
