const DatabaseService = require('./database-service');
const Lead = require('../models/lead');

function aggregateBy(filter, field) {
  return [
    { "$match": filter },
    {
        "$project":{
            "_id": 0,
            "y": { "$year": `$${field}` },
            "m": { "$month": `$${field}` },
            "d": { "$dayOfMonth":  `$${field}` }
        }
    },
    {
        "$group": {
            "_id": {
                "year": "$y",
                "month": "$m",
                "day": "$d"
            },
            "count" : { "$sum" : 1 }
        }
    },
    { "$sort" : { "_id.year": 1, "_id.month": 1, "_id.day": 1 }}
  ];
}

class FunnelService extends DatabaseService {
  constructor(uri, options) {
    super(uri, options);
  }

  getTargetStats(userName) {
    return this.getStats({owner: userName, targeted_on: { "$exists": true }, activity: { $ne: 'retweet' }}, 'targeted_on');
  }

  getProspectStats(userName) {
    return this.getStats({
      owner: userName,
      followers_count: { $gte: 100, $lte: 1500 },
      targeted_on: {$exists: true},
      'stats.rt': { $lt: 90 },
      activity: { $ne: 'retweet' },
      $or: [{adquired_on: { $exists: false}}, {cleared_on: { $exists: true }} ]
    }, 'targeted_on');
  }

  getAdquiredStats(userName) {
    return this.getStats({owner: userName, adquired_on: { "$exists": true }}, 'adquired_on');
  }

  getActivatedStats(userName) {
    return this.getStats({owner: userName, activated_on: { "$exists": true }}, 'activated_on');
  }

  getClearedStats(userName) {
    return this.getStats({owner: userName, cleared_on: { "$exists": true }}, 'cleared_on');
  }

  getStats(filter, field) {
    return new Promise((resolve, reject) => {
      let params = aggregateBy(filter, field);
      Lead.aggregate(params, (err, result) => {
        if (err) {
            reject(err);
        } else {
            console.log(result)
            resolve(result);
        }
      });
    });
  }

}

module.exports = FunnelService;
