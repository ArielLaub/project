var Promise = require('bluebird');
var bcrypt = require('bcrypt');

var chai = require('chai');
var expect = chai.expect;

var bookshelf = require('../../model/bookshelf');
var Account = require('../../model/account');
var Errors = require('../../model/errors');

describe('Account Model', () => {
    before(done => {
        bookshelf.knex.schema.dropTableIfExists('accounts').then(() => {
            return bookshelf.knex.schema.createTable('accounts', function (table) {
                table.increments();
                table.timestamps();
                table.string('email').unique().index().notNullable();
                table.string('password').notNullable;
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
        Account.login('ariel.laub@gmail.com', 'cookielida').then(account => {
            expect(account).to.not.be.null;
            var json = account.toJSON();
            expect(json).to.have.property('email', 'ariel.laub@gmail.com');
        }).then(done).catch(done);
    });
    
    it('should fail to login with the wrong password', done => {
        Account.login('ariel.laub@gmail.com', 'wrong').then(() => {
           throw new Error('should never happen');
        }).catch(Errors.WrongEmailOrPassword, err => {
            done(); //expected to throw this error
        }).catch(done);
    });
});