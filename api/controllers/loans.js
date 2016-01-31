'use strict'
var Promise = require('bluebird');
var express = require('express');
var ServiceProxy = require('../../bus/service_proxy');
var Authenticate = require('../middlewares/authenticate');

var utils  = require('../../utils');
var Errors = require('../../errors');

var GeneralError = utils.error.GeneralError;
var logger = utils.logger.create('api.controllers.loans');

function init(router, connection) {
    var loansService = new ServiceProxy(connection, 'LoanFinder.Service');
    var notificationsService = new ServiceProxy(connection, 'Notifications.Service');
    
    var authenticate = Authenticate(connection);

    // get an instance of the router for api routes
    var routes = express.Router(); 

    routes.post('/find', authenticate, function(req, res) {
        loansService.getQualifingLenders({
            account_id: req.accountId,
            affiliate_id: req.affiliate_id,
            answers: req.answers,
            customers_other_businesses: req.customers_other_businesses,
            revenues_over_5m: req.revenues_over_5m,
            process_over_4k: req.process_over_4k,
            process_card: req.process_card
        }).then(result => {
            res.json({success: true, result: result});
        }).catch(error => {
            req.logger.error(`error matching loans - ${error}`);
            res.json({success: false, error: error.message})
        });
    });
        
    return Promise.all([
        loansService.init(),
        notificationsService.init()
    ]).then(() => {
        router.use('/loans', routes);
    });
}
    

module.exports.init = init;