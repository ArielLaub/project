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
    

    it('should get some results', function(done) {
        service.getQuestions({}).then(questions => {
            var answers = [];
            questions.forEach(question => {
                var answer = {
                    answer_id: question.options[Math.min(4, question.options.length-1)].id,
                    question_id: question.id
                }
                answers.push(answer);
            });
            
            return service.getQualifingLenders({
                account_id: 1,
                affiliate_id: 11,
                affiliate_sub_id: 111,
                answers: answers
            });
        }).then(results => {
            expect(results).to.have.length;
            done();
        }).catch(done);
    });
    
    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });

});