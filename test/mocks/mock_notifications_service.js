'use strict'

var Promise = require('bluebird');
var MessageService = require('../../bus/message_service');
var factory = require('./message_factory');
var utils = require('../../utils');
var GeneralError = utils.error.GeneralError;
var Account = require('../../model/account');

class MockNotificationsService extends MessageService {
    constructor(connection) {
        super(connection, 'Notifications.Service');
        this.sent = {
            welcome: [],
            reminder24h: []
        };
    }
    
    _handleRequest(request, name) {
        this.sent[name].push(request);
        
        return Promise.resolve({
            results: [
                {email: 'ariel.laub@gmail.com', status: 'OK', _id: '12345', reject_reason: ''}
            ]
        });
    }
    send24HoursReminderEmail(request) {
        return this._handleRequest(request, 'reminder24h')
    }
    
    sendWelcomeEmail(request) {
        return this._handleRequest(request, 'welcome')
    }
}

module.exports = MockNotificationsService;