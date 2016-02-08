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

describe('Loans Controller tests', function() {
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
        }).then(() => {
            var account = {
                email: 'test@gmail.com',
                password: '123456',
                first_name: 'test',
                last_name: 'test',
                company: 'Bambi Inc',
                company_number: '11111111',
                phone: '411',
                postal_code: '666'
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
                    expect(account).to.have.property('access_token');
                    token = account.access_token;
                    done();
                });            
            });
    });
    
    it('should find qualifing lenders', function(done) {
        var body = {
            affiliate_id: '123',
            exact_loan_amount: 123456,
            exact_business_established: 5,
            answer:{'1': '3','3': '24','4': '34','7': '45','5': '50','6': '38','2': '16','10': '63','9': '60'},
            business_bank_account: '',
            business_credit_card: '',
            process_card: '1',
            process_over_2500: '1',
            customers_other_businesses: '1',
            revenues_over_5m: '1'
        };
        request
            .post('/api/loans/find')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send(body)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);
                expect(response.body).to.have.property('success', true);
                expect(response.body).to.have.property('result');
                done();
            });
    });

    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
});
