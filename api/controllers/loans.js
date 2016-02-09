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
        if (!req.body.company)
            return res.status(400).json({success: false, error: 'company name is required'});
        if (!req.body.company_number)
            return res.status(400).json({success: false, error: 'company number is required'});

        return loansService.setAccountCompanyInfo({
            account_id: req.accountId,
            company_name: req.body.company,
            company_number: req.body.company_number,
            phone: req.body.phone,
            postal_code: req.body.postal_code
        }).then(() => {
            return loansService.getQualifingLenders({
                account_id: req.accountId,
                affiliate_id: req.body.affiliate_id,
                affiliate_sub_id: req.body.affiliate_sub_id,
                form_fields: {
                    other_industry: !!req.body.other_industry,
                    exact_loan_amount: utils.parseInt(req.body.exact_loan_amount),
                    exact_business_established: req.body.exact_business_established,
                    customers_other_businesses: !!req.body.customers_other_businesses,
                    revenues_over_5m: !!req.body.revenues_over_5m,
                    process_over_2500: !!req.body.process_over_2500,
                    process_card: !!req.body.process_card,
                    business_bank_account: !!req.body.business_bank_account,
                    business_credit_card: !!req.body.business_credit_card,
                    personal_guarantee: !!req.body.personal_guarantee,
                    answer: req.body.answer
                }
            });            
        }).then(result => {
            res.status(200).json({success: true, result: result.matches || []});
        }).catch(error => {
            logger.error(`error matching loans - ${error}`);
            res.status(500).json({success: false, error: error.message})
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