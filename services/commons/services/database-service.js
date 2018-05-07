const mongoose = require('mongoose');

class DatabaseService {
  constructor(uri, options) {
    mongoose.connect(uri, options);
  }

  batchInsert(Model, items) {
    return new Promise((resolve, reject) => {
      Model.insertMany(items, { ordered: false }, (err, docs) => {
        if (err) reject({err, docs});
        resolve(docs);
      });
    });
  }

  batchUpdate(Model, filter, update) {
    return new Promise((resolve, reject) => {
      Model.update(filter, update,
        { multi: true }, (err) =>{
          if(err) reject(err);
          resolve();
        });
    });
  }

  close() {
    mongoose.connection.close();
  }
}

module.exports = DatabaseService;
