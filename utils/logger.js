'use strict'
var bunyan = require('bunyan');

module.exports.create = function(moduleName) {
    return bunyan.createLogger({
        name: require('path').basename(process.argv['1'], '.js'),
        level: 'info',
        module: moduleName,
        app: 'fundbird_platform',
    });
}