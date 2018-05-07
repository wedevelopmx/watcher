const DatabaseService = require('./database-service');
const User = require('../models/user');
const Lead = require('../models/lead');

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

  findLeads(filter, limit, sort) {
    return new Promise((resolve, reject) => {
      Lead
      .find(filter)
      .limit(limit || 20)
      .sort(sort)
      .exec((err, users) => {
        if (err) reject(err);
        resolve(users);
      });
    });
  }

}

module.exports = WatcherService;
