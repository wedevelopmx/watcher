const amqp = require('amqplib/callback_api');
const q = {
  listener_on: 'listener_on',
  listener_off: 'listener_off',
  listener_update: 'listener_update'
}

// Monitor messages to our steam service
const uri = 'amqp://rabbitmq:rabbitmq@rabbit/';

class WatcherPipe {
  constructor() {
    let _self = this;
    amqp.connect(uri, function(err, conn) {
      console.log(`>> Rabbit connected`);
      conn.createChannel(function(err, ch) {
        console.log(`>> Channel up`);
        ch.assertQueue(q.listener_on, {durable: false});
        ch.assertQueue(q.listener_off, {durable: false});
        ch.assertQueue(q.listener_update, {durable: false});
        
        _self.ch = ch;
      });
    });
  }
  
  listenerOn(userName) {
    this.ch.sendToQueue(q.listener_on, new Buffer(JSON.stringify({ user: userName})));
  }
  
  listenerOff(userName) {
    this.ch.sendToQueue(q.listener_off, new Buffer(JSON.stringify({ user: userName})));
  }
  
  listenerUpdate(userName) {
    this.ch.sendToQueue(q.listener_update, new Buffer(JSON.stringify({ user: userName})));
  }
}

module.exports = WatcherPipe;
