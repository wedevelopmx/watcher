const moment = require('moment');
const express = require('express');
const router = express.Router();
const config = require('../config');
const WatcherService = require('commons').WatcherService;
const WatcherPipe = require('commons').WatcherPipe;
const Term = require('commons').Term;
const utils = { moment: moment };

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
const watcherPipe = new WatcherPipe();

module.exports = function(app, passport) {
  // define the home page route
  app.get('/', function (req, res) {
    res.render('index')
  })

  // define the about route
  app.get('/dashboard', isLoggedIn, function (req, res) {
    res.render('dashboard', {
      user: req.user
    })
  });
  
  app.get('/terms', isLoggedIn, function (req, res) {
    watcherService.findAllTerms(req.user.screen_name).then(result => {
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
        watcherService.findAllTerms(req.user.screen_name).then(result => {
          res.render('terms', {
            user: req.user,
            terms: result
          });
          
          watcherPipe.listenerUpdate(req.user.screen_name);
        });
      });
    });
  });

  app.get('/deactivated', isLoggedIn, function (req, res) {
    let field = 'cleared_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;
    let now = today(field);

    watcherService
    .findLeadAndCount({ owner: userName, activated_on: { $exists: true}, last_seen_on: { $lte: now } }, page.size, page.offset, page.sort)
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
        events: 'deactivated_events',
        utils: utils
      }, page));
    });
  });

  app.get('/activated', isLoggedIn, function (req, res) {
    let field = 'activated_on';
    let page = pageable(req, field);
    let userName = req.user.twitter.username;
    let now = today(field);

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
    let now = today(field);

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
    let now = today();

    watcherService
    .findLeadAndCount({
      owner: userName,
      followers_count: { $gte: page.filter.followers_count },
      targeted_on: {$exists: true},
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
  let now = new Date();
  now.setHours(0);
  now.setMinutes(0);
  return now;
}

function pageable(req, defaultSort) {
  let sort = {};
  let asc = req.query.asc && req.query.asc == 'true' ? true : false;
  let sortBy = req.query.sort || defaultSort ||'followers_count';
  let followers_count = req.query.followers_count || 50;
  sort[sortBy] = asc ? 1 : -1;

  return {
    size: parseInt(req.query.size || 10),
    offset: parseInt(req.query.offset || 0),
    filter: {
      followers_count: followers_count
    },
    sortBy: sortBy,
    sort: sort,
    asc: asc
  }
}
