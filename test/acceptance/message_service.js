'use strict'

var chai = require('chai');
var utils = require('../../utils');

var factory = require('../mocks/message_factory');
var TestService = require('../mocks/test_service');
var Connection = require('../../bus/amqp/connection');
var MessageDispatcher = require('../../bus/amqp/message_dispatcher');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Message Service', () => {
    var service;
    var dispatcher
    var serverConnection, clientConnection;
    
    before(done => {
        serverConnection = new Connection();
        clientConnection = new Connection();
        serverConnection.connectUrl()
            .then(() => {
                service = new TestService(serverConnection);
                return service.init();
            })
            .then(() => {
                return clientConnection.connectUrl();
            })
            .then(() => {
                dispatcher = new MessageDispatcher(clientConnection);
                return dispatcher.init();
            })
            .then(() => {
                return serverConnection.queuePurge(1, 'Test.TestService', false);
            })
            .then(() => {
                done();
            });
    });
    
    var testRequestData = {
        name: 'Ariel Laub',
        desc: 'Really awesome guy',
        important: true,
        price: 9.99,
        quantity: 1
    };

    it('should test an rpc call', done => {
        service.nextResult = {
            name: 'Naomi Laub',
            age: 5,
            validated: true,
            score: 90.4
        };
        var request = factory.buildRequest('Test.TestService.testMethod', testRequestData);
        var promise = dispatcher.publish(request.encode().toBuffer(), 'REQUEST.Test.TestService.testMethod');
        promise.then(data => {
            var response = factory.decodeResponse(data);
            expect(response).to.have.property('result');
            expect(response.result).to.have.property('message');
            expect(response.result.message).to.have.property('name', 'Naomi Laub');
            done();
        })
        .catch(err => {
            done(err);
        });
    });
    
    it('should test an error from rpc call', done => {
        service.nextResult = new GeneralError('just an error', 123456);
        var request = factory.buildRequest('Test.TestService.testMethod', testRequestData);
        var promise = dispatcher.publish(request.encode().toBuffer(), 'REQUEST.Test.TestService.testMethod');
        promise.then(data => {
            var response = factory.decodeResponse(data);
            expect(response).to.have.property('error');
            expect(response.error).to.have.property('message', 'just an error');
            expect(response.error).to.have.property('code', 123456);
            done();
        })
        .catch(err => {
            done(err);
        });        
    });
});