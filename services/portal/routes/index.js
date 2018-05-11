const express = require('express');
const router = express.Router();
const config = require('../config');
const WatcherService = require('commons').WatcherService;

const watcherService = new WatcherService(config.mongo.uri, config.mongo.options);

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
  })

  app.get('/deactivated', isLoggedIn, function (req, res) {
    let page = pageable(req);
    let userName = req.user.twitter.username;
    let now = today();

    watcherService
    .findLeadAndCount({ owner: userName, activated_on: { $exists: true}, last_seen_on: { $lte: now } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', {
        user: req.user,
        accounts: result.leads,
        resource: 'deactivated',
        count: result.count,
        size: page.size,
        offset: page.offset,
        sortBy: page.sortBy,
        asc: page.asc
      });
    });
  });

  app.get('/activated', isLoggedIn, function (req, res) {
    let page = pageable(req);
    let userName = req.user.twitter.username;
    let now = today();

    // last_seen_on: { $gte: now }
    watcherService
    .findLeadAndCount({ owner: userName, activated_on: { $exists: true}, last_seen_on: { $gte: now } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', {
        user: req.user,
        accounts: result.leads,
        resource: 'activated',
        count: result.count,
        size: page.size,
        offset: page.offset,
        sortBy: page.sortBy,
        asc: page.asc
      });
    });
  });

  app.get('/adquired', isLoggedIn, function (req, res) {
    let page = pageable(req);
    let userName = req.user.twitter.username;
    let now = today();

    watcherService
    .findLeadAndCount({ owner: userName, adquired_on: { $exists: true }, cleared_on: { $exists: false } }, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', {
        user: req.user,
        accounts: result.leads,
        resource: 'adquired',
        count: result.count,
        size: page.size,
        offset: page.offset,
        sortBy: page.sortBy,
        asc: page.asc
      });
    });
  });


  app.get('/target', isLoggedIn, function (req, res) {
    let page = pageable(req);
    let userName = req.user.twitter.username;
    let now = today();

    watcherService
    .findLeadAndCount({owner: userName, targeted_on: {$exists: true}, $or: [{adquired_on: { $exists: false}}, {cleared_on: { $exists: true }} ]}, page.size, page.offset, page.sort)
    .then(result => {
      console.log(`>> Displaying ${ result.leads.length} of ${result.count}`)
      res.render('leads', {
        user: req.user,
        accounts: result.leads,
        resource: 'target',
        count: result.count,
        size: page.size,
        offset: page.offset,
        sortBy: page.sortBy,
        asc: page.asc
      });
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

function pageable(req) {
  let sort = {};
  let asc = req.query.asc && req.query.asc == 'true' ? true : false;
  let sortBy = req.query.sort || 'followers_count';
  sort[sortBy] = asc ? 1 : -1;

  return {
    size: parseInt(req.query.size || 10),
    offset: parseInt(req.query.offset || 0),
    sortBy: sortBy,
    sort: sort,
    asc: asc
  }
}
