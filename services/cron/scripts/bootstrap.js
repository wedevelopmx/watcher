const config = require('../config');
const data = require('../data/terms');
const WatcherService = require('commons').WatcherService;
const User = require('commons').User;
const Term = require('commons').Term;

let watcherService = new WatcherService(config.mongo.uri, config.mongo.options);
let screenName = 'clegislativomx';
let terms = data.map(item => { return { owner: screenName, name: item.twitter} });
let welcome = 'Hola, \n¿Alguna vez te preguntaste que tanto trabaja tu diputado? Nosotros sí, y al tratar de averiguarlo nos perdimos en muchos portales de gobierno. \n \nComo no queríamos que te pasara lo mismo creamos #ContactoLegislativo, un portal en el cual puedes encontrar de manera sencilla a tu diputado, su información de contacto y un resumen de su desempeño. \n \nTe invitamos a visitar nuestro portal (https://contactolegislativo.com) y si te gusta ayúdanos a la difusión de este proyecto a través de tus redes sociales. \n \nGracias por seguirnos! \n#ContactoLegislativo';

watcherService
  .batchInsert(User, [{ screen_name: screenName, welcome: welcome, credentials: config.user.credentials, twitter: config.user.twitter }])
  .then(result => {
    Term.remove({}).then(() => {
      watcherService.batchInsert(Term, terms)
      .then(result => {
        console.log(`>> Terms ${result.length}.`);
        watcherService.close();
      });
    });
  });
