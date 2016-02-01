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
    
    var authenticate = Authenticate(connection);
    
    // get an instance of the router for api routes
    var routes = express.Router(); 

    routes.post('/authenticate', function(req, res) {
        accountsService.authenticate({
            email: req.body.email,
            password: req.body.password
        }).then(response => {
            if (response.error) 
                throw new GeneralError(response.error.message, response.error.code || -1);
            else
                res.json({ success: true, result: response });
        }).catch(error => {
            logger.info(`failed attempt to fetch me for ${req.accountId}`);
            res.json({ success: false, error: 'access_denied'});
        });
    });
    
    routes.get('/me', authenticate, function(req, res) {
        accountsService.getAccountById({account_id: req.accountId})
            .then(response => {
                if (response.error) throw new GeneralError(response.error.message, response.error.code)
                
                res.json({ success: true, result: response.result});
            }).catch(error => {
                logger.info(`failed attempt to fetch me for ${req.accountId}`);
                res.json({ success: false, error: 'access_denied'});
            });
    });
    
    routes.post('/resetPassword', function(req, res) {
        accountsService.resetPassword({email: req.body.email})
            .then(response => {
                if (response.value === 'error') 
                    throw new GeneralError(response.error.message, response.error.code);
                return notificationsService.sendResetPasswordEmail({account_id: response.result.id}, false);
            }).catch(error => {
                logger.error(`error sending reset password email to ${req.body.email} - ${error.message}`);
            }).finally(() => {
                res.json({success: true}); //do not expose reset password errors to consumers
            });
    }); 
    
    routes.post('/setPassword', function(req, res) {
        accountsService.setPassword({
            email: req.body.email,
            old_password_or_token: req.body.old_password_or_token,
            new_password: req.body.new_password
        }).then(result => {
            res.json({success: true});
        }).catch(error => {
            logger.error(`failed attempt to set new password for ${req.body.email} - ${error.message}`);
            res.json({success: false, error: 'access_denied'});
        });
    });
    
    routes.post('/verifyEmail', function(req, res) {
        accountsService.verifyEmail({
            email: req.body.email,
            email_verification_token: req.body.email_verifycation_token
        }).then(result => {
            res.json({success: true});
        }).catch(error => {
            logger.error(`failed attempt to verify email for ${req.body.email} - ${error.message}`);
            res.json({success: false, error: 'access_denied'});
        });
    });
    
    routes.post('/create', function(req, res) {
        accountsService.create({
            email: req.body.email,
            password: req.body.password,
            profile: req.body.profile
        }).then(result => {
            res.json({success: true, result: result});
        }).catch(error => {
            res.json({success: false, error: error.message, code: error.code});
        });
    });
    
    return Promise.all([
        accountsService.init(),
        notificationsService.init()
    ]).then(() => {
        router.use('/accounts', routes);
    });
}
    

module.exports.init = init;