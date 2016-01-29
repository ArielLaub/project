'use strict'

var chai = require('chai');
var utils = require('../../utils');

var factory = require('../mocks/message_factory');
var TestService = require('../mocks/test_service');
var Connection = require('../../bus/amqp/connection');
var MessageDispatcher = require('../../bus/amqp/message_dispatcher');
var ServiceProxy = require('../../bus/service_proxy');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Message Service', () => {
    var service;
    var client;
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
                client = new ServiceProxy(clientConnection, 'Test.TestService');
                return client.init();
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
        client.testMethod(testRequestData).then(response => {
            expect(response).to.have.property('name', 'Naomi Laub');
            done();
        })
        .catch(err => {
            done(err);
        });
    });
    
    it('should test an error from rpc call', done => {
        service.nextResult = new GeneralError('test_error', 123456);
        client.testMethod(testRequestData).catch(err => {
            expect(err).to.exist;
            expect(err).to.have.property('message', 'test_error');
            expect(err).to.have.property('code', '123456');
            done();
        });        
    });
});