'use strict'

var chai = require('chai');
var bookshelf = require('../../model/bookshelf');

var utils = require('../../utils');
var factory = require('../mocks/message_factory');
var Connection = require('../../bus/amqp/connection');
var IdentityService = require('../../services/identity_service');
var ServiceProxy = require('../../bus/service_proxy');
var LoanProcess = require('../../model/loan_process');

var expect = chai.expect;
var GeneralError = utils.error.GeneralError;

describe('Identity Service', () => {
    var service, client, connection;
    
    before(function(done) {
        connection = new Connection();
        connection.connectUrl()
            .then(() => {
                service = new IdentityService(connection);
                return service.init();
            })
            .then(() => {
                client = new ServiceProxy(connection, 'Identity.Service');
                return client.init();
            })
            .then(() => {
                return connection.queuePurge(1, 'Identity.Service', false);
            }).then(() => { done(); }).catch(done);
    });
    
    it('should validate a valid company', function(done) {
        client.validateCompany({company_number: '09847403', company_name: 'orange'}).then(response => {
            expect(response).to.have.property('valid', true);
            done(); 
        });
    });

    it('should fail validating with an invalid company number', function(done) {
        client.validateCompany({company_number: '10398111', company_name: 'orange'}).then(response => {
            expect(response).to.have.property('valid', false);
            done();
        });
    });

    it('should fail validating with an invalid company name', function(done) {
        client.validateCompany({company_number: '09847403', company_name: 'blue'}).then(response => {
            expect(response).to.have.property('valid', false);
            done(); 
        });
    });
    
    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });

});