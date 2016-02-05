'use strict'

var chai = require('chai');
var bookshelf = require('../../model/bookshelf');

var utils = require('../../utils');
var factory = require('../mocks/message_factory');
var Connection = require('../../bus/amqp/connection');
var LoanFinderService = require('../../services/loan_finder_service');
var ServiceProxy = require('../../bus/service_proxy');
var LoanProcess = require('../../model/loan_process');

var expect = chai.expect;
var GeneralError = utils.error.GeneralError;

describe('Loan Finder Service', () => {
    var service, client, connection;
    
    before(function(done) {
        connection = new Connection();
        connection.connectUrl()
            .then(() => {
                service = new LoanFinderService(connection);
                return service.init();
            })
            .then(() => {
                return connection.connectUrl();
            })
            .then(() => {
                client = new ServiceProxy(connection, 'LoanFinder.Service');
                return client.init();
            })
            .then(() => {
                return connection.queuePurge(1, 'LoanFinder.Service', false);
            }).then(() => { done(); }).catch(done);
    });
    

    var answers;
    var formFields;
    it('should get some results', function(done) {
        answers = {};
        formFields = {
            business_bank_account: true,
            business_credit_card: true,
            process_card: true,
            revenues_over_5m: true,
            customers_other_businesses: true,
            other_industry: true,
            exact_loan_amount: 10000,
            exact_business_established: 5
        }
        service.getQuestions({}).then(questions => {
            questions.forEach(question => {
                answers[question.id] = question.options[Math.min(4, question.options.length-1)].id
            });
            
            formFields.answer = answers;
            return service.getQualifingLenders({
                account_id: 1,
                affiliate_id: 11,
                affiliate_sub_id: 111,
                form_fields: formFields
            });
        }).then(results => {
            expect(results).to.have.length;
            done();
        }).catch(done);
    });
    
    it('should get the last account application', function(done) {
        service.getAccountLastApplication({account_id: 1}).then(response => {
            console.log(JSON.stringify(response, null, 4));
            expect(response).to.have.property('results');
            expect(response).to.have.property('form_fields');
            expect(response.form_fields).to.have.property('business_bank_account', formFields.business_bank_account);
            expect(response.form_fields).to.have.property('business_credit_card', formFields.business_credit_card);
            expect(response.form_fields).to.have.property('process_card', formFields.process_card);
            expect(response.form_fields).to.have.property('revenues_over_5m', formFields.revenues_over_5m);
            expect(response.form_fields).to.have.property('customers_other_businesses', formFields.customers_other_businesses);
            expect(response.form_fields).to.have.property('other_industry', formFields.other_industry);
            expect(response.form_fields).to.have.property('exact_loan_amount', formFields.exact_loan_amount);
            expect(response.form_fields).to.have.property('exact_business_established', formFields.exact_business_established);
            expect(response.form_fields).to.have.property('answer');
            Object.keys(response.form_fields.answer).forEach(qid => {
                expect(response.form_fields.answer).to.have.property(qid, response.form_fields.answer[qid]);
            });
            done();
        }).catch(done);
    });
    
    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });

});