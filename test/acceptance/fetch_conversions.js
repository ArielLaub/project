'use strict'

var chai = require('chai');
var utils = require('../../utils');
var bookshelf = require('../../model/bookshelf');
var MockAnalyticsService = require('../mocks/mock_analytics_service');
var Connection = require('../../bus/amqp/connection');
var MessageDispatcher = require('../../bus/amqp/message_dispatcher');
var ServiceProxy = require('../../bus/service_proxy');
var LoanProcess = require('../../model/loan_process');
var fetchConversions = require('../../scheduled_tasks/fetch_conversions');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Fetch Conversions', function() {
    var service;
    var client;
    var connection, clientConnection;
    
    before(done => {
        connection = new Connection();
        clientConnection = new Connection();

        connection.connectUrl()
            .then(() => {
                service = new MockAnalyticsService(connection);
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
                return connection.queuePurge(1, 'Analytics.Service', false);
            })
            .then(() => {
                return bookshelf.knex.schema.dropTableIfExists('users_processes');
            })
            .then(() => {
                return bookshelf.knex.schema.createTable('users_processes', function (table) {
                    table.increments();
                    table.timestamps();
                    table.integer('process_id');
                    table.integer('user_id');
                    table.text('form_fields');
                    table.text('results');
                    table.text('has_offers_data');
                    table.string('ip', 60);
                    table.string('country_by_ip', 100);
                });                
            })
            .then(() => {
                done();
            }).catch(done);
    });

    var processId;
    var accountId = 1;
    var lastConvertedTime;
    it('should convert a loan process', function(done) {
        LoanProcess.create(accountId, [
            {question_id: 1, answer_id: 1},
            {question_id: 2, answer_id: 2}
        ], {
            business_bank_acount: true,
            business_credit_card: true,
            customers_other_businesses: false,
            revenues_over_5m: false,
            process_over_4k: false
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
        LoanProcess.create(accountId, [
            {question_id: 1, answer_id: 10},
            {question_id: 2, answer_id: 20}
        ], {
            business_bank_acount: false,
            business_credit_card: true,
            customers_other_businesses: true,
            revenues_over_5m: false,
            process_over_4k: false
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