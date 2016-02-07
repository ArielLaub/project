'use strict'

var Promise = require('bluebird');
var bcrypt = require('bcrypt');

var chai = require('chai');
var expect = chai.expect;

var bookshelf = require('../../model/bookshelf');
var Account = require('../../model/account');
var Errors = require('../../errors');
var seed = require('../mocks/seed');

describe('Account Model', () => {
    before(done => {
        seed.resetAccounts().then(() => {
            done();
        }).catch(done);
    });
    
    it('should create an account', done => {
        Account.create({email:'ariel.laub@gmail.com', password:'cookielida', first_name: 'Ariel', last_name: 'Laub'})
            .then(account => {
                expect(account).to.have.property('email', 'ariel.laub@gmail.com');
                expect(bcrypt.compareSync('cookielida', account.password)).to.be.true;
                done();        
            }).catch(done);
    });
    
    it('should login an account', done => {
        Account.authenticate('ariel.laub@gmail.com', 'cookielida').then(account => {
            expect(account).to.not.be.null;
            expect(account).to.have.property('email', 'ariel.laub@gmail.com');
        }).then(done).catch(done);
    });
    
    it('should fail to login with the wrong password', done => {
        Account.authenticate('ariel.laub@gmail.com', 'wrong').then(() => {
           throw new Error('should never happen');
        }).catch(Errors.WrongEmailOrPassword, err => {
            done(); //expected to throw this error
        }).catch(done);
    });
    
    it('should reset the user password', done => {
        Account.resetPassword('ariel.laub@gmail.com').then(account => {
            return Account.setPassword('ariel.laub@gmail.com', account.reset_password_token, '123456');
        }).then(() => {
            return Account.authenticate('ariel.laub@gmail.com', '123456'); 
        }).then(account => {
            done();
        }).catch(done);
    });
    
    it('should reset a password using the old password', done => {
        Account.setPassword('ariel.laub@gmail.com', '123456', 'cookielida').then(() => {
            return Account.authenticate('ariel.laub@gmail.com', 'cookielida'); 
        }).then(account => {
            done();
        }).catch(done);      
    });
    
    it('should fail resetting the password of a wrong email', done => {
        Account.resetPassword('ariel.laub@ggg.ggg').then(() => {
            done('should have failed updating password. this email does not exist');
        }).catch(err => {
           expect(err.message).to.equal('No Rows Updated');
           done(); 
        });
    });
    
    it('should fail resetting the password if token expired', done => {
        var token;
        Account.resetPassword('ariel.laub@gmail.com').then(account => {
            token = account.reset_password_token;
            return Account.where({email: 'ariel.laub@gmail.com'}).save({
                reset_password_expires_at: new Date(Date.now()-1000)}, {method: 'update'});
        }).then(() => {
            return Account.setPassword('ariel.laub@gmail.com', token, '123456');
        }).then(() => {
            done('should have failed updating password with an expired token');
        }).catch(err => {
            expect(err.message).to.equal('invalid credentials');
            done();
        });
    });
});