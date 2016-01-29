'use strict'

var chai = require('chai');
var utils = require('../../utils');

var factory = require('../mocks/message_factory');
var AnalyticsService = require('../../services/analytics_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('AnalyticsService', () => {
    var service;
    var client;
    var serverConnection, clientConnection;
    
    before(done => {
        serverConnection = new Connection();
        clientConnection = new Connection();
        serverConnection.connectUrl()
            .then(() => {
                service = new AnalyticsService(serverConnection);
                return service.init();
            })
            .then(() => {
                return clientConnection.connectUrl();
            })
            .then(() => {
                client = new ServiceProxy(clientConnection, 'Analytics.Service');
                return client.init();
            })
            .then(() => {
                return serverConnection.queuePurge(1, 'Analytics.Service', false);
            })
            .then(() => {
                done();
            });
    });
    

    xit('should get some results', done => { //just sanity to see we have a conversion in the last 2 weeks
        var from = Math.floor(Date.now()/1000) - 14*86400;
        client.getConvertedAccounts({from: from}).then(response => {
            expect(response).to.have.property('result');
            expect(response.result).to.have.property('account_ids').instanceof(Array);
            done();
        }).catch(done);
    });
    
});