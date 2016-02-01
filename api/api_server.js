'use strict'

var express     = require('express');
var bodyParser  = require('body-parser');
var Connection = require('../bus/amqp/connection');
var Config = require('../config'); // get our config file
var utils = require('../utils');
var logger = utils.logger.create('api.server');

var app         = express();
    
var port = process.env.PORT || 3000;

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
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

// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

var router = express.Router();
app.use('/api', router);

// API ROUTES -------------------
// we'll get to these in a second
var connection = new Connection();
connection.connectUrl().then(() => {
    return require('./controllers/accounts').init(router, connection);
}).then(() => {
    app.listen(port);
    logger.info('API is served at http://localhost:' + port);
});


