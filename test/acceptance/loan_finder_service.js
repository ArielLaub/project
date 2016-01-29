'use strict'

var chai = require('chai');
var utils = require('../../utils');

var factory = require('../mocks/message_factory');
var LoanFinderService = require('../../services/loan_finder_service');
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
                service = new LoanFinderService(serverConnection);
                return service.init();
            })
            .then(() => {
                return clientConnection.connectUrl();
            })
            .then(() => {
                client = new ServiceProxy(clientConnection, 'LoanFinder.Service');
                return client.init();
            })
            .then(() => {
                return serverConnection.queuePurge(1, 'LoanFinder.Service', false);
            })
            .then(() => {
                done();
            });
    });
    

    it('should get some results', done => {
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
        });
    });
    
});