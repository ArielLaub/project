'use strict'

var Promise = require('bluebird');
var utils = require('./utils')
var logger = utils.logger.create('bus.listener');
var Connection = require ('./bus/connection');
var MessageListener = require('./bus/message_listener');
var MessageDispatcher = require('./bus/message_dispatcher');
var GeneralError = utils.error.GeneralError;

var connection = new Connection();
var listener = new MessageListener(connection);
var dispatcher = new MessageDispatcher(connection);

connection.connectUrl()
    .then(() => {
        return listener.init((message, id) => {
            return new Promise((resolve, reject) => {
                logger.info(`RECEIVED MESSAGE ${id}: ${message}`);
                //throw new Error('invalid thing');
                resolve('{field: 1, param: 2}');
            });
        }, 'test_worker');
    })
    .then(() => {return listener.subscribe(['USER.CREATED.*'])})
    .then(() => {return listener.start()})
    .then(() => {return dispatcher.init()})
    .then(() => {
        dispatcher.publish("{username: 'ariellaub', password: '123456'}", 'USER.CREATED.1', true);
    }).then(result => {
        logger.info(`RECEIVED RESULT ${result}`);
    })
    .catch((err) => {
        logger.info(err.stack);
        throw err;
    });
