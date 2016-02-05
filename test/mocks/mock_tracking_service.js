'use strict'

var Promise = require('bluebird');
var MessageService = require('../../bus/message_service');
var factory = require('./message_factory');
var utils = require('../../utils');
var GeneralError = utils.error.GeneralError;

class MockTrackingService extends MessageService {
    constructor(connection) {
        super(connection, 'Tracking.Service');
        this._data = [];
    }
    
    addConvertedProcess(accountId, processId, offerId, offerName) {
        this._data.push({
            account_id: accountId,
            process_id: processId,
            offer_id: offerId,
            name: offerName
        });
    }
    
    clearConvertedProcesses() {
        return Promise.method(() => {
            this._data = [];
        });
    }
    getConvertedAccounts(request) {
        return Promise.resolve(this._data);
    }
    
    
}

module.exports = MockTrackingService;