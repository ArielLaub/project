'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var Config = require('../config');
var Errors = require('../errors');

var utils  = require('../utils');
var logger = utils.logger.create('services.tracking_service');
var hasOffers = require('./tracking/has_offers');

function dateString(timestamp) {
    var date = utils.ticksToDate(timestamp);
    var Y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var H = date.getHours();
    var i = date.getMinutes();
    var s = date.getSeconds();
    
    return `${Y}-${m}-${d} ${H}:${i}:${s}`;
}

const PROCESS_ID_FIELD_NAME = 'affiliate_info3';
const ACCOUNT_ID_FIELD_NAME = 'affiliate_info4';

class TrackingService extends MessageService {
    constructor(connection) {
        super(connection, 'Tracking.Service');
    }
    
    getConvertedAccounts(request) {
        var limit = request.limit || 100;
        var fields = [
            `Stat.${ACCOUNT_ID_FIELD_NAME}`,
            `Stat.${PROCESS_ID_FIELD_NAME}`,
            'Stat.offer_id', 
            'Offer.name'
        ];
        
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
                        result.push({
                            account_id: utils.parseInt(value.Stat[ACCOUNT_ID_FIELD_NAME]),
                            process_id: utils.parseInt(value.Stat[PROCESS_ID_FIELD_NAME]),
                            offer_id: value.Stat['offer_id'],
                            name: value.Offer['name']
                        });
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