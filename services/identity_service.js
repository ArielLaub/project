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
    
    validateCompany(request) {
        return new Promise((resolve, reject) => {
            if (!request.company_number) return reject(new Errors.CompanyNumberRequired());
            if (!request.company_name) return reject(new Errors.CompanyNameRequired());

            return companiesHouse.getCompanyProfile(request.company_number).then(response => {
                if (response.errors)
                    return {valid: false, error: response.errors[0].error};
                
                var name = response.company_name.toLowerCase();
                var status = response.company_status;
                //var createdAt = response.date_of_creation;
                //TODO add validation for creation date.   
                             
                var userWords = request.company_name.toLowerCase().split(' ');
                if (userWords.length > 0)
                    userWords.forEach(word => {
                        if (name.indexOf(word) === -1)
                            resolve({valid: false, error: 'name does not match'});
                    });
                    
                if (status !== 'active')
                    resolve({valid: false, error: 'invalid company status'});
                    
                resolve({valid: true});
            }).catch(error => {
                resolve({valid: false, error: 'invalid company number'});
            });
        })
    }
}

module.exports = IdentityService;