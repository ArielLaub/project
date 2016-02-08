'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var Config = require('../config');
var Errors = require('../errors');

var utils  = require('../utils');
var logger = utils.logger.create('services.identity_service');
var companiesHouse = require('./identity/companies_house');

class IdentityService extends MessageService {
    constructor(connection) {
        super(connection, 'Identity.Service');
    }
    
    verifyCompany(request) {
        return new Promise((resolve, reject) => {
            if (!request.company_number) return reject(new Errors.CompanyNumberRequired());
            if (!request.company_name) return reject(new Errors.CompanyNameRequired());

            return companiesHouse.getCompanyProfile(request.company_number).then(response => {
                if (response.errors)
                    return resolve({valid: false, error: response.errors[0].error});
                
                var name = response.company_name.toLowerCase();
                var status = response.company_status;
                //var createdAt = response.date_of_creation;
                //TODO add validation for creation date.   
                             
                var userWords = request.company_name.toLowerCase().split(' ');
                if (userWords.length > 0)
                    userWords.forEach(word => {
                        if (name.indexOf(word) === -1)
                            return resolve({valid: false, error: 'Company name does match', field: 'name'});
                    });
                    
                if (status !== 'active')
                    return resolve({valid: false, error: 'Company is not registered as active', field: 'status'});
                    
                return resolve({valid: true});
            }).catch(error => {
                return resolve({valid: false, error: 'invalid company number', field: 'number'});
            });
        })
    }
}

module.exports = IdentityService;