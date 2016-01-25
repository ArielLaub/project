'use strict' 

var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var MessageService = require('../bus/message_service');
var Account = require('../model/account');
var Config = require('../config');
var Errors = require('../Errors')
var utils  = require('../utils');
var logger = utils.logger.create('services.accounts_service');

class AccountsService extends MessageService {
    constructor(connection, privateKey, publicKey) {
        super(connection, 'Accounts.Service');
        
        this._privateKey = privateKey || Config.jwtPrivateKey;
        this._publicKey = publicKey || Config.jwtPublicKey;
        this._sign = (payload) => {
            return new Promise((resolve, reject) => {
                resolve(jwt.sign(payload, {key: this._privateKey, passphrase: '123456'}, { algorithm: 'RS256'}));
            });
        };
        this._verify = (token) => {
            return new Promise((resolve, reject) => {
                jwt.verify(token, this._publicKey, { algorithms: ['RS256'] }, function(err, token) {
                    if (err) return reject(err);
                    resolve(token);
                });
            });
        };
    }
    
    create(request) {
        var account = new Account({email: request.email, password: request.password});
        var jsonAccount;
        return account.save().then(account => {
            jsonAccount = account.toJSON();
            return this._sign({id: account.id});
        }).then(token => {
            let result = {
                id: jsonAccount.id,
                email_verification_token:  jsonAccount.email_verification_token,
                access_token: token
            }
            return result;
        });
    }
    
    authenticate(request) {
        var accountId;
        return Account.authenticate(request.email, request.password).then(account => {
            accountId = account.id;
            return this._sign({id: account.id});
        }).then(token => {
            return {
                access_token: token,
                id: accountId
            }
        });
    }
    
    verifyToken(request) {
        return this._verify(request.access_token);
    }
    
    resetPassword(request) {
        return Account.resetPassword(request.email).then(account => {
            return {
                id: account.id,
                reset_password_token: account.reset_password_token
            }
        }).catch(error => {
            logger.warn(`failed attempt to reset password for invalid email ${request.email} with error ${error.message}`);
            throw new Errors.WrongEmailOrPassword();
        }).tap(account => {
            logger.error(JSON.stringify(account));
        });
    }
    
    setPassword(request) {
        return Account.setPassword(request.email, request.oldPasswordOrToken, request.newPassword);
    }
    
    verifyEmail(request) {
        return Account.verifyEmail(request.email, request.token);
    }
    
    getAccountById(request) {
        return Account.getAccountById(request.account_id);
    }
}

module.exports = AccountsService;
