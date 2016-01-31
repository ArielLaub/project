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
    var connection;
    
    before(done => {
        connection = new Connection();
        connection.connectUrl()
            .then(() => {
                service = new AnalyticsService(connection);
                return service.init();
            })
            .then(() => {
                client = new ServiceProxy(connection, 'Analytics.Service');
                return client.init();
            })
            .then(() => {
                return connection.queuePurge(1, 'Analytics.Service', false);
            })
            .then(() => {
                done();
            });
    });
    

    it('should get some results', function(done) { //just sanity to see we have a conversion in the last 2 weeks
        this.timeout(20000);
        var from = Math.floor(Date.now()/1000) - 14*86400;
        client.getConvertedAccounts({from: from, affiliate_id: 1060, limit: 10}).then(response => {
            expect(response).to.have.property('account_ids').instanceof(Array);
            done();
        }).catch(done);
    });
    
});