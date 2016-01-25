'use strict'

var Promise = require('bluebird');
var utils = require('./utils')
var logger = utils.logger.create('service_loader');
var Connection = require ('./bus/amqp/connection');
var AccountsService = require('./services/accounts_service');
var NotificationsService = require('./services/notifications_service');

var connection = new Connection();

connection.connectUrl().then(() => {
    var accounts = new AccountsService(connection);
    var notifications = new NotificationsService(connection);
    
    return Promise.all([
        accounts.init(), 
        notifications.init()
    ]);
});

