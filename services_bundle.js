'use strict'

var Promise = require('bluebird');
var utils = require('./utils')
var logger = utils.logger.create('main');
var Connection = require ('./bus/amqp/connection');
var AccountsService = require('./services/accounts_service');
var NotificationsService = require('./services/notifications_service');
var AnalyticsService = require('./services/analytics_service');
var LoanFinderService = require('./services/loan_finder_service');

var connection = new Connection();

connection.connectUrl().then(() => {
    require('./api/api_server');

    var accounts = new AccountsService(connection);
    var notifications = new NotificationsService(connection);
    var analytics = new AnalyticsService(connection);
    var loans = new LoanFinderService(connection); 
    return Promise.all([
        accounts.init(), 
        notifications.init(),
        analytics.init(),
        loans.init()
    ]);
    
});

