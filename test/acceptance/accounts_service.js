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
    var connection;
    
    before(done => {
        connection = new Connection();
        connection.connectUrl()
            .then(() => {
                service = new AccountsService(connection);
                return service.init();
            })
            .then(() => {
                client = new ServiceProxy(connection, service.serviceName);
                return client.init();
            })
            .then(() => {
                return connection.queuePurge(1, service.serviceName, false);
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
        client.create(createRequest).then(account => {
            expect(account).to.have.property('access_token');
            expect(account).to.have.property('id');
            expect(account.email_verification_token).to.have.lengthOf(40);
            theAccount = account;
            theToken = account.access_token;
            done();
        }).catch(done);
    });
    
    it('should verify email', done => {
        client.verifyEmail({email: 'ariel@fundbird.co.uk', token: theAccount.email_verification_token})
            .then(response => {
                expect(response).to.have.property('message');
                done();
            }).catch(done);
    });
    
    it('should verify a token', done => {
        client.verifyToken({access_token: theToken}).then(response => {
            expect(response).to.have.property('id', theAccount.id);
            done();
        }).catch(done);
    });
});