'use strict'

var chai = require('chai');

var factory = require('../mocks/message_factory');
var AccountsService = require('../../services/accounts_service');
var MockNotificationsService = require('../mocks/mock_notifications_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var bookshelf = require('../../model/bookshelf');
var seed = require('../mocks/seed');

var expect = chai.expect;

describe('Accounts Service', function() {
    var accountsService, notificationsService;
    var client;
    var connection;
    
    before(function(done) {
        connection = new Connection();
        connection.connectUrl().then(() => {
            accountsService = new AccountsService(connection);
            return accountsService.init();
        })
        .then(() => {
            notificationsService = new MockNotificationsService(connection);
            return notificationsService.init();
        })
        .then(() => {
            client = new ServiceProxy(connection, accountsService.serviceName);
            return client.init();
        })
        .then(() => {
            return connection.queuePurge(1, accountsService.serviceName, false);
        })
        .then(() => {
            return seed.resetAccounts();
        })
        .then(() => {
            done();
        }).catch(done);
    });
    
    var theToken, theAccount;
    it('should create an account', function(done) {
        var createRequest = {
            email: 'ariel@fundbird.co.uk',
            password: '123456'
        };
        client.create(createRequest).then(account => {
            expect(account).to.have.property('access_token');
            expect(account).to.have.property('id');
            expect(account.email_verification_token).to.have.lengthOf(40);
            //expect(notificationsService.sent.welcome).to.have.lengthOf(1);
            //expect(notificationsService.sent.welcome[0]).to.have.property('account_id', account.id);
            theAccount = account;
            theToken = account.access_token;
            done();
        }).catch(done);
    });
        
    it('should verify email', function(done) {
        client.verifyEmail({email: 'ariel@fundbird.co.uk', token: theAccount.email_verification_token})
            .then(response => {
                expect(response).to.have.property('message');
                done();
            }).catch(done);
    });
    
    it('should verify a token', function(done) {
        client.verifyToken({access_token: theToken}).then(response => {
            expect(response).to.have.property('account_id', theAccount.id);
            done();
        }).catch(done);
    });


    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
});

