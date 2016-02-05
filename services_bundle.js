'use strict'

var Promise = require('bluebird');
var utils = require('./utils')
var logger = utils.logger.create('main');
var Connection = require ('./bus/amqp/connection');
var AccountsService = require('./services/accounts_service');
var NotificationsService = require('./services/notifications_service');
var TrackingService = require('./services/tracking_service');
var LoanFinderService = require('./services/loan_finder_service');

var connection = new Connection();

connection.connectUrl().then(() => {
    var accounts = new AccountsService(connection);
    var notifications = new NotificationsService(connection);
    var tracking = new TrackingService(connection);
    var loans = new LoanFinderService(connection); 
    return Promise.all([
        accounts.init(), 
        notifications.init(),
        tracking.init(),
        loans.init()
    ]);
});

