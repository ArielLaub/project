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
    var identityService = new ServiceProxy(connection, 'Identity.Service');
    
    var authenticate = Authenticate(connection);

    // get an instance of the router for api routes
    var routes = express.Router(); 

    routes.post('/verifyCompany', authenticate, function(req, res) {
        if (!req.body.company_number)
            res.status(400).json({success: false, error: 'company_number_required'});
        if (!req.body.company_name)
            res.status(400).json({success: false, error: 'company_name_required'});
        
        identityService.verifyCompany({
            company_name: req.body.company_name,
            company_number: req.body.company_number
        }).then(result => {
            res.status(200).json({success: true, result: result});
        }).catch(error => {
            req.logger.error(`error matching loans - ${error}`);
            res.status(500).json({success: false, error: error.message})
        });
    });
        
    return identityService.init()
        .then(() => {
            router.use('/identity', routes);
        });
}
    

module.exports.init = init;