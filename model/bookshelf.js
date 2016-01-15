var Config = require('../config');
var knex = require('knex')({
  client: 'mysql',
  connection: Config.mySqlConnectionString, 
  pool: {
    min: 0,
    max: 100
  }
});

var bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;
