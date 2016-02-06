'use strict'

var chai = require('chai');
var utils = require('../../utils');
var bookshelf = require('../../model/bookshelf');
var MockTrackingService = require('../mocks/mock_tracking_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var LoanProcess = require('../../model/loan_process');
var fetchConversions = require('../../scheduled_tasks/fetch_conversions');
var seed = require('../mocks/seed');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Fetch Conversions', function() {
    var service;
    var client;
    var connection;
    
    before(done => {
        connection = new Connection();

        connection.connectUrl()
            .then(() => {
                service = new MockTrackingService(connection);
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
                return seed.resetLoanProcesses();                
            })
            .then(() => {
                done();
            }).catch(done);
    });

    var processId;
    var accountId = 1;
    var lastConvertedTime;
    it('should convert a loan process', function(done) {
        LoanProcess.create(accountId, {"1":"1", "2": "2"}, {
            business_bank_account: true,
            business_credit_card: true,
            customers_other_businesses: false,
            revenues_over_5m: false,
            process_card: false,
            process_over_2500: false,
            personal_guarentee: true
        }, [12, 9, 13, 14], '127.0.0.1').then(process => {
            processId = process.process_id;
        }).then(() => {
            service.addConvertedProcess(accountId, processId, '100', 'Ariel Loans Inc');
            return fetchConversions.execute();
        }).then(() => {
            return LoanProcess.getByAccountAndProcessId(1, processId);
        }).then(process => {
            expect(process).to.have.property('user_id', accountId);
            expect(process).to.have.property('process_id', processId);
            expect(process).to.have.property('has_offers_data');
            expect(process.has_offers_data).to.have.property('offer_id', '100');
            expect(process.has_offers_data).to.have.property('name', 'Ariel Loans Inc');
            lastConvertedTime = process.updated_at;
            done();
        }).catch(done);
    });
    
    it('should check the last converted date is reflected', function(done) {
        LoanProcess.getLastConvertedTime().then(result => {
            expect(result.getTime()).to.equal(lastConvertedTime.getTime());
            done();
        });
    });
    
    it('should not convert if no has offers data yet', function(done) {
        LoanProcess.create(accountId, {"1": "10", "2": "20"}, {
            business_bank_account: false,
            business_credit_card: true,
            customers_other_businesses: true,
            revenues_over_5m: false,
            process_card: true,
            process_over_2500: false,
            personal_guarentee: false
        }, [12, 9, 13, 14], '127.0.0.1').then(process => {
            processId = process.process_id;
        }).then(() => {
            return fetchConversions.execute();
        }).then(() => {
            return LoanProcess.getByAccountAndProcessId(1, processId);
        }).then(process => {
            expect(process).to.have.property('user_id', accountId);
            expect(process).to.have.property('process_id', processId);
            expect(process).to.have.property('has_offers_data');
            expect(process.has_offers_data).to.be.null;
            done();
        }).catch(done);        
    });
    
    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
  
});