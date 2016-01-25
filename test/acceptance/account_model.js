var Promise = require('bluebird');
var bcrypt = require('bcrypt');

var chai = require('chai');
var expect = chai.expect;

var bookshelf = require('../../model/bookshelf');
var Account = require('../../model/account');
var Errors = require('../../errors');

describe('Account Model', () => {
    before(done => {
        bookshelf.knex.schema.dropTableIfExists('accounts').then(() => {
            return bookshelf.knex.schema.createTable('accounts', function (table) {
                table.increments();
                table.timestamps();
                table.string('email', 100).unique().index().notNullable();
                table.string('first_name', 60);
                table.string('last_name', 60);
                table.string('password', 100).notNullable();
                table.boolean('email_verified').defaultTo(false).notNullable();
                table.string('email_verification_token', 100);
                table.string('reset_password_token', 100);
                table.timestamp('reset_password_expires_at');
            });
        }).then(() => { done(); }).catch(done);
    });
    
    it('should create an account', done => {
        var account = Account.forge({email: 'ariel.laub@gmail.com', password: 'cookielida'});
        expect(account.get('email')).to.equal('ariel.laub@gmail.com');
        expect(account.get('password')).to.equal('cookielida');
        account.save().tap(account => {
            var json = account.toJSON();
            expect(json).to.have.property('email', 'ariel.laub@gmail.com');
            expect(json).to.have.property('password').with.lengthOf(60); //bscrypt hash has length of 60
            expect(bcrypt.compareSync('cookielida', json.password)).to.be.true;        
        }).then(() => { done(); });
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
            expect(err.message).to.equal('wrong email or password');
            done();
        });
    });
});