'use strict'

var chai = require('chai');
var utils = require('../../utils');

var factory = require('../mocks/message_factory');
var TrackingService = require('../../services/tracking_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Tracking Service', () => {
    var service;
    var client;
    var connection;
    
    before(function(done) {
        connection = new Connection();
        connection.connectUrl()
            .then(() => {
                service = new TrackingService(connection);
                return service.init();
            })
            .then(() => {
                client = new ServiceProxy(connection, 'Tracking.Service');
                return client.init();
            })
            .then(() => {
                return connection.queuePurge(1, 'Tracking.Service', false);
            })
            .then(() => {
                done();
            });
    });
    

    xit('should get some results', function(done) { //just sanity to see we have a conversion in the last 2 weeks
        this.timeout(20000);
        var from = Math.floor(Date.now()/1000) - 14*86400;
        client.getConvertedAccounts({from: from, affiliate_id: 1060, limit: 10}).then(response => {
            expect(response).to.have.property('account_ids').instanceof(Array);
            done();
        }).catch(done);
    });
    
    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
});