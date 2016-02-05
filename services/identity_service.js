'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var Config = require('../config');
var Errors = require('../errors');

var utils  = require('../utils');
var logger = utils.logger.create('services.tracking_service');

class IdentityService extends MessageService {
    constructor(connection) {
        super(connection, 'Tracking.Service');
    }
    
    getConvertedAccounts(request) {
        var limit = request.limit || 100;
        var fields = [`Stat.${ACCOUNT_ID_FIELD_NAME}`];
        var filters = {};
        filters[`Stat.${ACCOUNT_ID_FIELD_NAME}`] = {conditional: 'GREATER_THAN', values: 0} 
                   
        if (request.from && request.to) {
            filters['Stat.datetime'] = {
                conditional: 'BETWEEN', values: [dateString(request.from), dateString(request.to)]
            }
        } else if (request.from) {
            filters['Stat.datetime'] = {
                conditional: 'GREATER_THAN', values: dateString(request.from)
            }
        } else if (request.to) {
            filters['Stat.datetime'] = {
                conditional: 'LESS_THAN', values: dateString(request.to)
            }            
        }
        
        if (request.affiliate_id) {
            filters['Stat.affiliate_id'] = {
                conditional: 'EQUAL_TO', values: request.affiliate_id
            }
        }
        
        if (request.account_ids && request.account_ids.length > 0) {
            filters[`Stat.${ACCOUNT_ID_FIELD_NAME}`] = {
                conditional: 'EQUALS_TO', values: request.account_ids
            }
        }
        
        return hasOffers.report.getConversions({fields, filters, limit}).then(response => {
            let result = [];
            if (response.data && response.data.data) {
                response.data.data.forEach(value => {
                    try {
                        result.push(parseInt(value.Stat.affiliate_info4));
                    } catch (error) {
                        logger.error(`fetched invalid account id from hasOffers ${value}`);
                    }
                });
            }
            return result;
        });
    }
}

module.exports = TrackingService;