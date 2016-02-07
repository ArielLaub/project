'use strict'
var Promise = require('bluebird');
var express = require('express');
var ServiceProxy = require('../../bus/service_proxy');
var Authenticate = require('../middlewares/authenticate');

var utils  = require('../../utils');
var Errors = require('../../errors');

var GeneralError = utils.error.GeneralError;
var logger = utils.logger.create('api.controllers.accounts');

function init(router, connection) {
    var accountsService = new ServiceProxy(connection, 'Accounts.Service');
    var notificationsService = new ServiceProxy(connection, 'Notifications.Service');
    var loanFinderService = new ServiceProxy(connection, 'LoanFinder.Service');
    
    var authenticate = Authenticate(connection);
    
    // get an instance of the router for api routes
    var routes = express.Router(); 

    routes.post('/authenticate', function(req, res) {
        return accountsService.authenticate({
            email: req.body.email,
            password: req.body.password
        }).then(result => {
            return loanFinderService.getAccountLastApplication({account_id: result.id}).then(application => {
                if (application)
                    Object.assign(result, application.form_fields);
                
                res.set('Authorization', `Bearer ${result.token}`);
                //logger.error(require('util').inspect(result));
                res.status(200).json({ success: true, result: result });
            });
        }).catch(error => {
            logger.info(`failed to authenticate ${JSON.stringify(req.body)} - ${error.message}`);
            res.status(401).json({ success: false, error: 'access_denied'});
        });
    });
    
    routes.get('/me', authenticate, function(req, res) {
        accountsService.getAccountById({account_id: req.accountId})
            .then(result => {
                res.status(200).json({ success: true, result: result});
            }).catch(error => {
                logger.info(`failed attempt to fetch me for ${req.accountId}`);
                res.status(401).json({ success: false, error: 'access_denied'});
            });
    });
    
    routes.post('/resetPassword', function(req, res) {
        accountsService.resetPassword({email: req.body.email})
            .then(result => {
                return notificationsService.sendResetPasswordEmail({account_id: result.id}, false);
            }).catch(error => {
                logger.error(`error sending reset password email to ${req.body.email} - ${error.message}`);
            }).finally(() => {
                res.status(200).json({success: true}); //do not expose reset password errors to consumers
            });
    }); 
    
    routes.post('/changePassword', function(req, res) {
        accountsService.setPassword({
            email: req.body.email,
            old_password_or_token: req.body.old_password_or_token,
            new_password: req.body.new_password
        }).then(result => {
            res.status(200).json({success: true});
        }).catch(error => {
            logger.error(`failed attempt to set new password for ${req.body.email} - ${error.message}`);
            res.status(401).json({success: false, error: 'access_denied'});
        });
    });
    
    routes.post('/verifyEmail', function(req, res) {
        accountsService.verifyEmail({
            email: req.body.email,
            email_verification_token: req.body.email_verifycation_token
        }).then(result => {
            res.status(200).json({success: true});
        }).catch(error => {
            logger.error(`failed attempt to verify email for ${req.body.email} - ${error.message}`);
            res.status(401).json({success: false, error: 'access_denied'});
        });
    });
    
    routes.post('/create', function(req, res) {
        var params = {
            email: req.body.email,
            password: req.body.password,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            company: req.body.company,
            company_number: req.body.company_number,
            phone: req.body.phone,
            postal_code: req.body.postal_code,
        };
        
        accountsService.create(params).then(result => {
            res.status(200).json({success: true, result: result});
        }).catch(error => {
            throw error;
            res.status(401).json({success: false, error: error.message, code: error.code});
        });
    });
    
    routes.post('/refreshToken', authenticate, function(req, res) {
        res.status(200).json({success: true});
    })
    
    routes.post('/logout', function(req, res) {
        res.status(200).json({success: true});
    });
    
    return Promise.all([
        accountsService.init(),
        notificationsService.init(),
        loanFinderService.init()
    ]).then(() => {
        router.use('/accounts', routes);
    });
}
    

module.exports.init = init;