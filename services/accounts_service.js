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
        var account = {
            email: request.email,
            password: request.password,
            first_name: request.first_name,
            last_name: request.last_name,
            company: request.company,
            company_number: request.company_number,
            phone: request.phone,
            postal_code: request.postal_code,
            reffid: request.referrer_id, //TODO: FIX THIS SILLY TYPO IN DB FIELD NAME!!!
            affid: request.affiliate_id
        };
        return Account.create(account).then(newAccount => {
            account = newAccount;
            return this.notifications.sendWelcomeEmail({account_id: account.id});                
        }).then(() => {
            return this._sign({id: account.id});
        }).then(token => {
            let result = {
                access_token: token,
                id: account.id,
                first_name: account.first_name,
                last_name: account.last_name,
                company: account.company,
                company_number: account.company_number,
                phone: account.phone,
                postal_code: account.postal_code,
                email_verification_token:  account.email_verification_token,
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
                    first_name: account.first_name,
                    last_name: account.last_name,
                    company: account.company,
                    company_number: account.company_number,
                    phone: account.phone,
                    postal_code: account.postal_code,
                    email_verification_token:  account.email_verification_token,
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
        return Account.setPassword(request.email, request.old_password_or_token, request.new_password)
            .then(account => {
                return {message: 'OK'};
            });
    }
    
    verifyEmail(request) {
        return Account.verifyEmail(request.email, request.token);
    }
    
    getAccountById(request) {
        return Account.getAccountById(request.account_id).then(account => {
            return {
                id: account.id, 
                email: account.email, 
                first_name: account.first_name,
                last_name: account.last_name,
                company: account.company,
                company_number: account.company_number,
                phone: account.phone,
                postal_code: account.postal_code,
                email_verification_token:  account.email_verification_token,
            }
        });
    }
}

module.exports = AccountsService;
