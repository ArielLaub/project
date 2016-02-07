'use strict'

var Promise = require('bluebird');
var chai = require('chai');
var supertest = require('supertest');
var webServer = require('../../web_server');
var AccountsService = require('../../services/accounts_service');
var MockNotificationsService = require('../mocks/mock_notifications_service');
var LoanFinderService = require('../../services/loan_finder_service');
var Connection = require('../../bus/amqp/connection');
var seed = require('../mocks/seed');

var expect = chai.expect;

describe('Accounts Controller tests', function() {
    var request;
    var connection = new Connection();
    var notifications = new MockNotificationsService(connection);
    var accounts = new AccountsService(connection);
    var loanFinder = new LoanFinderService(connection);
    var token;
    
    before(function(done) {
        connection.connectUrl().then(() => {
            return Promise.all([
                notifications.init(),
                accounts.init(),
                loanFinder.init()             
            ]);
        }).then(() => {
           return seed.resetAccounts(); 
        }).then(() => {
            return webServer.createApp();
        }).then(app => {
            request = supertest(app);
            done();
        });
    });
    
    it('should create a new account', function(done) {
        var account = {
            email: 'naomi.laub@gmail.com',
            password: '123456',
            first_name: 'Naomi',
            last_name: 'Laub',
            company: 'Noodnik Inc',
            company_number: '654321',
            phone: '144',
            postal_code: '333'
        };
        
        request
            .post('/api/accounts/create')
            .set('Accept', 'application/json')
            .send(account)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);
                expect(response.body).to.have.property('success', true);
                expect(response.body).to.have.property('result');
                var account = response.body.result;
                expect(account).to.have.property('id');
                expect(account).to.have.property('access_token');
                expect(account).to.have.property('first_name', 'Naomi')
                expect(account).to.have.property('last_name', 'Laub')
                expect(account).to.have.property('company', 'Noodnik Inc')
                expect(account).to.have.property('company_number', '654321')
                expect(account).to.have.property('phone', '144')
                expect(account).to.have.property('postal_code', '333')
                done();
            });
    });
    
    it('should authenticate an account', function(done) {
        var params = {
            email: 'naomi.laub@gmail.com',
            password: '123456',
        }
        
        request
            .post('/api/accounts/authenticate')
            .set('Accept', 'application/json')
            .send(params)
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);
                token = response.access_token;
                done();
            });
    });
    
    it('should change an account password', function(done) {
        var params = {
            email: 'naomi.laub@gmail.com',
            old_password_or_token: '123456',
            new_password: '654321',
        }
        
        request
            .post('/api/accounts/changePassword')
            .set('Accept', 'application/json')
            .set('Authorization', `Berear ${token}`)
            .send(params)
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);
                
                done();
            });
        
    });
    
    it('should fail authenticating with the old password', function(done) {
        var params = {
            email: 'naomi.laub@gmail.com',
            password: '123456',
        }
        
        request
            .post('/api/accounts/authenticate')
            .set('Accept', 'application/json')
            .send(params)
            .expect(401)
            .end((err, response) => {
                if (err) return done(err);
                expect(response).to.have.property('error');
                done();
            });        
    });
    
    it('should succeed authenticating with the new password', function(done) {
        var params = {
            email: 'naomi.laub@gmail.com',
            password: '654321',
        }
        
        request
            .post('/api/accounts/authenticate')
            .set('Accept', 'application/json')
            .send(params)
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);
                done();
            });        
    });


    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
});
