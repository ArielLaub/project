'use strict'

var chai = require('chai');

var MockNotificationsService = require('../mocks/mock_notifications_service');
var Connection = require('../../bus/amqp/connection');
var ServiceProxy = require('../../bus/service_proxy');
var bookshelf = require('../../model/bookshelf');
var seed = require('../mocks/seed');

var expect = chai.expect;

describe('Email Reminders', function() {
    var notificationsService;
    var connection;
    
    before(function(done) {
        connection = new Connection();
        connection.connectUrl().then(() => {
            notificationsService = new MockNotificationsService(connection);
            return notificationsService.init();
        })
        .then(() => {
            done();
        }).catch(done);
    });
    
    it('')

    after(function(done) {
        connection.disconnect().then(() => {
            done();
        });
    });
});

