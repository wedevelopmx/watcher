const DatabaseService = require('./database-service');
const User = require('../models/user');
const Lead = require('../models/lead');
const Term = require('../models/term');

class WatcherService extends DatabaseService {
  constructor(uri, options) {
    super(uri, options);
  }

  findUsers(filter, limit, sort) {
    return new Promise((resolve, reject) => {
      User
      .find(filter)
      .limit(limit || 20)
      .sort(sort)
      .exec((err, users) => {
        if (err) reject(err);
        resolve(users);
      });
    });
  }

  findAllTerms(owner) {
    return new Promise((resolve, reject) => {
      Term
      .find({ owner: owner })
      .exec((err, terms) => {
        if (err) reject(err);
        resolve(terms);
      });
    });
  }

  findLeadAndCount(filter, limit, offset, sort) {
    let _self = this;
    return new Promise((resolve, reject) => {
      Promise.all([
        _self.findLeads(filter, limit, offset, sort),
        _self.countLeads(filter)
      ]).then(result => {
        resolve({
          leads: result[0],
          count: result[1]
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  findLeads(filter, limit, offset, sort) {
    return new Promise((resolve, reject) => {
      Lead
      .find(filter)
      .limit(limit || 20)
      .skip(offset)
      .sort(sort)
      .exec((err, users) => {
        if (err) reject(err);
        resolve(users);
      });
    });
  }

  countLeads(filter) {
    return new Promise((resolve, reject) => {
      Lead
      .find(filter)
      .count()
      .exec((err, count) => {
        if (err) reject(err);
        resolve(count);
      });
    });
  }

}

module.exports = WatcherService;
