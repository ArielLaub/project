'use strict' 

var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var MessageService = require('../bus/message_service');
var ServiceProxy = require('../bus/service_proxy');
var Account = require('../model/account');
var Config = require('../config');
var Errors = require('../errors')
var utils  = require('../utils');
var logger = utils.logger.create('services.accounts_service');

class AccountsService extends MessageService {
    constructor(connection, privateKey, publicKey) {
        super(connection, 'Accounts.Service');
        
        this.notifications = new ServiceProxy(connection, 'Notifications.Service');
        
        this._privateKey = privateKey || Config.jwtPrivateKey;
        this._publicKey = publicKey || Config.jwtPublicKey;
        this._sign = (payload) => {
            return new Promise((resolve, reject) => {
                var _key = {key: this._privateKey, passphrase: '123456'};
                resolve(jwt.sign(payload, _key, { algorithm: 'RS256', expiresIn: '365d'}));
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
    
    init() {
        return super.init()
            .then(() => {
                return this.notifications.init();
            });
    }
    
    create(request) {
        var account = new Account();
        return account.save({email: request.email, password: request.password})
            .tap(account => {
                return this.notifications.sendWelcomeEmail({account_id: account.id});                
            }).then(newAccount => {
                account = newAccount;
                return this._sign({id: account.id});
            }).then(token => {
                let result = {
                    id: account.id,
                    email_verification_token:  account.get('email_verification_token'),
                    access_token: token
                }
                return result;
            }).catch(error => {
                if (error.code === 'ER_DUP_ENTRY') {
                    return new Errors.EmailAlreadyExists();
                } else {
                    logger.error(`unrecognized error while creating account - ${error.message}`);
                    throw new Errors.InternalError();
                }
            });
    }
    
    authenticate(request) {
        return Account.authenticate(request.email, request.password).then(account => {
            return this._sign({id: account.id}).then(token => {
                return {
                    access_token: token,
                    id: account.id,
                    profile: {
                        first_name: accountget('first_name'),
                        last_name: account.get('last_name'),
                        company: account.get('company'),
                        company_number: account.get('company_number'),
                        phone: account.get('phone'),
                        postal_code: account.get('postal_code'),
                        
                    }
                }
            });
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
            return new Errors.WrongEmailOrPassword();
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
