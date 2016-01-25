'use strict'

var chai = require('chai');

var factory = require('../mocks/message_factory');
var AccountsService = require('../../services/accounts_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var bookshelf = require('../../model/bookshelf');

var expect = chai.expect;

describe('Accounts Service', () => {
    var service;
    var client;
    var serverConnection, clientConnection;
    
    before(done => {
        serverConnection = new Connection();
        clientConnection = new Connection();
        serverConnection.connectUrl()
            .then(() => {
                return bookshelf.knex('accounts').delete();
            })
            .then(() => {
                service = new AccountsService(serverConnection);
                return service.init();
            })
            .then(() => {
                return clientConnection.connectUrl();
            })
            .then(() => {
                client = new ServiceProxy(clientConnection, service.serviceName);
                return client.init();
            })
            .then(() => {
                return serverConnection.queuePurge(1, service.serviceName, false);
            })
            .then(() => {
                done();
            });
    });
    
    var theToken, theAccount;
    it('should create an account', done => {
        var createRequest = {
            email: 'ariel@fundbird.co.uk',
            password: '123456'
        };
        client.create(createRequest).then(response => {
            expect(response.result).to.not.be.null;
            expect(response.result).to.have.property('access_token');
            expect(response.result).to.have.property('id');
            expect(response.result.email_verification_token).to.have.lengthOf(40);
            theAccount = response.result;
            theToken = response.result.access_token;
            done();
        }).catch(done);
    });
    
    it('should verify email', done => {
        client.verifyEmail({email: 'ariel@fundbird.co.uk', token: theAccount.email_verification_token})
            .then(response => {
                expect(response.error).to.be.null;
                expect(response.result).to.have.property('message');
                done();
            }).catch(done);
    });
    
    it('should verify a token', done => {
        client.verifyToken({access_token: theToken}).then(response => {
            expect(response.error).to.be.null;
            expect(response.result).to.not.be.null;
            expect(response.result).to.have.property('id', theAccount.id);
            done();
        }).catch(done);
    });
});