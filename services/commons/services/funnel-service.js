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
    }
  ];
}

class FunnelService extends DatabaseService {
  constructor(uri, options) {
    super(uri, options);
  }

  getTargetStats() {
    return this.getStats({targeted_on: { "$exists": true }}, 'targeted_on');
  }

  getAdquiredStats() {
    return this.getStats({adquired_on: { "$exists": true }}, 'adquired_on');
  }

  getActivatedStats() {
    return this.getStats({activated_on: { "$exists": true }}, 'activated_on');
  }

  getStats(filter, field) {
    return new Promise((resolve, reject) => {
      let params = aggregateBy(filter, field);
      console.log(params)
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
