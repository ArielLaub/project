module.exports.error = require('./error');
module.exports.logger = require('./logger');

module.exports.dateToTicks = date => Math.floor(date.getTime()/1000);