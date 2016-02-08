'use strict'

function safeNumberParser(parser) {
    return (val, def) => {
        var result;
        try { 
            result = parser(val);
            if (!isNaN(result)) return result; 
        } catch (e) {}
        return def;        
    }
}


module.exports.error = require('./error');
module.exports.logger = require('./logger');

module.exports.dateToTicks = date => Math.floor(date.getTime()/1000);
module.exports.ticksToDate = ticks => new Date(ticks*1000);
module.exports.parseInt = safeNumberParser(parseInt);
module.exports.parseFloat = safeNumberParser(parseFloat);
