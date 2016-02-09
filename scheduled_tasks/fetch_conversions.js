'use strict'

var Promise = require('bluebird');
var ServiceProxy = require('../bus/service_proxy');
var Connection = require('../bus/amqp/connection');
var LoanProcess = require('../model/loan_process');
var utils  = require('../utils');
var logger = utils.logger.create('scheduled_tasks.fetch_conversions');

const FUNDBIRD_AFFILIATE_ID = '1060'; //we only fetch convertions for our account;

function execute() {
    logger.info('starting fetch conversions scheduled task');
    var connection = new Connection();
    var trackingService = new ServiceProxy(connection, 'Tracking.Service');
    return connection.connectUrl().then(() => {
        return trackingService.init();
    }).then(() => {
        return LoanProcess.getLastConvertedTime();
    }).then(from => {
        logger.info(`fetching conversion starting from ${from}`);
        return trackingService.getConvertedAccounts({
            from: utils.dateToTicks(from), 
            affiliate_id: FUNDBIRD_AFFILIATE_ID, 
            limit: 999
        });
    }).then(response => {
        if (response.results && response.results.length > 0) {
            logger.info(`fetched ${response.results.length} new conversions`);
            return Promise.each(response.results, result => {
                logger.info(`processing process for account`);
                return LoanProcess.setHasOffersData(
                    result.account_id,
                    result.process_id,
                    { offer_id: result.offer_id, name: result.name }
                ).catch(error => {
                    logger.error(error);
                });
            });
        }
    }).then(() => {
        logger.info('finishing processing conversions');
    });
}

if (require.main === module) {
    execute();
} else {
    module.exports.execute = execute;    
}
