var Promise  = require('bluebird');
var bcrypt   = Promise.promisifyAll(require('bcrypt'));
var crypto = Promise.promisifyAll(require('crypto'));
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.account');
var Errors = require('../errors');

const TABLE_NAME = 'users';
var Account = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
        
        this.on('updating', this.onUpdating);
        this.on('creating', this.onCreating);
    },

    _hashPassword: Promise.method(function(model, attrs, options) {
        if (!this.has('password'))
            return;
            
        return bcrypt.hashAsync(model.attributes.password, 10)
            .then(hash => {
                model.set('password', hash);
                model.set('reset_password_token', null);
                model.set('reset_password_expires_at', null);
                model.set('updated_at', new Date());
            });            
    }),
    
    onCreating: function(model, attrs, options) {
        return this._hashPassword(model, attrs, options)
            .then(() => {
                return crypto.randomBytesAsync(20)
            })
            .then(buf => {
                var token = buf.toString('hex');
                model.set('email_verified', false);
                model.set('email_verification_token', token);
                model.set('created_at', new Date());
            });
    },
    
    onUpdating: function(model, attrs, options)  {
        return this._hashPassword(model, attrs, options)
            .then(() => {
                model.set('updated_at', new Date());
            });
    }
}, 
{
    tableName: TABLE_NAME,
    create: function(email, password, profile) {
        return new Promise(resolve => {
            if (!email || !password) throw new Errors.WrongEmailOrPassword();
            resolve(new Account());        
        }).then((newAccount) => {
            //for now we just flatten the profile fields to the account itself.
            return newAccount.save(Object.assign({email: email, password: password}, profile || {}));            
        }).then(account => {
            return account.toJSON();
        }).catch(error => {
            throw error;
        })
    },
    
    //Class properties
    authenticate: function(email, password) {
        return new Promise(resolve => {
            if (!email || !password) 
                throw new Errors.WrongEmailOrPassword();
            resolve();
        }).then(() => {
            return new this({email: email.toLowerCase().trim()}).fetch({require: true});    
        }).catch(err => {
            if (err.message !== 'EmptyResponse')
                logger.error(err.stack);
            throw new Errors.WrongEmailOrPassword();
        }).then(account => {
            return bcrypt.compareAsync(password, account.get('password')).then(res => {
                if (!res) throw new Errors.WrongEmailOrPassword();
                
                return account.toJSON();
            });
        });
    },
    
    resetPassword: function(email) {
        return crypto.randomBytesAsync(20)
            .then(buf => {
                var token = buf.toString('hex');
                return Account.where({email: email}).save({
                    reset_password_token: token,
                    reset_password_expires_at: new Date(Date.now() + 360000)
                }, {method: 'update'});
            })
            .then(() => {
                return Account.where({email: email}).fetch().then(account => account.toJSON());
            });
    },
    
    setPassword: function(email, oldPasswordOrToken, newPassword) {
        return new this({email: email.toLowerCase().trim()}).fetch({require: true})
            .catch(err => {
                if (err.message !== 'EmptyResponse')
                    logger.error(err.stack);
                throw new Errors.WrongEmailOrPassword();
            })
            .then(account => {
                var tokenOk = (account.get('reset_password_expires_at') > Date.now() &&
                                oldPasswordOrToken === account.get('reset_password_token'));
                if (tokenOk)
                    return account.save({password: newPassword},{});
                
                return bcrypt.compareAsync(oldPasswordOrToken, account.get('password')).then(passwordOk => {
                    if (!passwordOk)
                        throw new Errors.WrongEmailOrPassword();
                        
                    return account.save({password: newPassword},{});
                });
            });        
    },
    
    verifyEmail: function(email, emailVerificationToken) {
        return new this({email: email.toLowerCase().trim()}).fetch({require: true})
            .catch(err => {
                if (err.message !== 'EmptyResponse')
                    logger.error(err.stack);
                throw new Errors.WrongEmailOrPassword();
            })
            .then(account => {
                if (emailVerificationToken === account.get('email_verification_token'))
                    return account.save({email_verified: true, email_verification_token: ''},{})
                        .then(account => {
                            return 'OK';
                        });
                else
                    throw new Errors.WrongEmailOrPassword();
            });        
    },
    
    getAccountById: function(id) {
        return new this({id: id}).fetch({require: true});
    }
})

module.exports = Account;