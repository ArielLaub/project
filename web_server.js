'use strict'

var Promise = require('bluebird');
var express = require('express');
var bodyParser = require('body-parser');
var Connection = require('./bus/amqp/connection');
var Config = require('./config');
var utils = require('./utils');
var logger = utils.logger.create('api.server');


function createApp() {
    var app         = express();
    
    app.use(express.static(__dirname + '/public'));
    app.use(bodyParser.json());

    app.use(require('express-bunyan-logger')({
        name: 'web-logger', 
        excludes: ['req', 'res', 'body', 'req-headers', 'res-headers', 'user-agent', 'response-hrtime'],
        parseUA: false,
        streams: [{
            level: 'info',
            stream: process.stdout
            }]
    }));
    //app.use(require('express-bunyan-logger').errorLogger());

    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
        next();
    });

    // root route
    app.get('/', function(req, res) {
        res.send('Hello! The API is at http://localhost:' + port + '/api');
    });

    var router = express.Router();
    app.use('/api', router);

    //api routes are added async because their initializing depends on a bus connection.
    var connection = new Connection();
    connection.on('connected', () => {
        logger.info('API bus connection established');
    });
    connection.on('disconnected', () => {
        logger.warn('API bus connection lost');
    });
    return connection.connectUrl().then(() => {
        return require('./api/controllers/accounts').init(router, connection);
    }).then(() => {
        return app;
    });
    
}

//expose app if file is required by a different module (used for api tests)
if (require.main === module) {
    createApp().then(app => {
        const port = process.env.PORT || 3000;
        app.listen(port);
        logger.info('API is served at http://localhost:' + port);
    });
} else {
    module.exports.createApp = createApp;    
}

