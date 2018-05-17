const Twit = require('twit');

class TwitterStream extends Twit {
  constructor(user, termSet) {
    super(user.credentials);
    this.termSet = termSet;
    this.track = termSet
      .filter(term => term.monitor )
      .map(term => term.name.replace('@',''));
    console.log(`>> Stream dispatched for #${this.track.length} terms enabled`);
    this.stream = this.stream('statuses/filter', { track: this.track, language: 'es' });
  }

  process(fnc) {
    this.processFnc = fnc;
    return this;
  }

  start() {
    console.log(`>> Creating stream for ${this.track} elements`);
    this.stream.on('tweet', this.processFnc);
    this.stream.on('parser-error', msg => console.log(`>> Parse Error ${msg}`));
    this.stream.on('error', msg => console.log(`>> Error ${msg}`));
    return this;
  }
  
  stop() {
    this.stream.stop();
  }
}

module.exports = TwitterStream;
