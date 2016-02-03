'use strict'

var Promise = require('bluebird');
var MessageService = require('../../bus/message_service');
var factory = require('./message_factory');
var utils = require('../../utils');
var GeneralError = utils.error.GeneralError;

class TestService extends MessageService {
    constructor(connection) {
        super(connection, 'Test.TestService');
        this.nextResult = null;
        
    }
    
    testMethod(message, id) {
        //if (!this.nextResult) throw new Error('no result set for test service');
        
        return new Promise((resolve, reject) => {
            if (!this.nextResult) return resolve() ;//throw new Error('no next result set for mock');
            var result = this.nextResult;
            this.nextResult = null;
            if (result instanceof Error)
                reject(result);
            else 
                resolve(result);
        });
    }
}

module.exports = TestService;