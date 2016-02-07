var Promise = require('bluebird');
var request = require('superagent');
var qs = require('qs');

var Config = require('../../config');
var utils = require('../../utils');
var logger = utils.logger.create('services.identity');

class CompaniesHouse {
    constructor() {
        
    }

    _sendRequest(path, query) {
        var url = `https://api.companieshouse.gov.uk${path}`;
        return new Promise((resolve, reject) => {
            request
                .get(url)
                .set('Accept', 'application/json')
                .auth(Config.companiesHouseApiKey, '')
                .query(query)
                .end(function(error, response) {
                    if (error) {
                        return reject(new Error(error.message));
                    } 
                    resolve(response.body);
                });            
            });
    }

    getCompanyProfile(companyNumber) {
        return this._sendRequest(`/company/${companyNumber}`);
    }
}

module.exports = new CompaniesHouse();