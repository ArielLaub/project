'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var ServiceProxy = require('../bus/service_proxy');
var Config = require('../config');
var Account = require('../model/account');
var Errors = require('../errors');
var utils  = require('../utils');
var logger = utils.logger.create('services.notifications_service');
var mandrill = require('mandrill-api/mandrill');


class NotificationsService extends MessageService {
    constructor(connection, emailClient) {
        super(connection, 'Notifications.Service');
        this.mandrillClient = emailClient || new mandrill.Mandrill(Config.mandrillApiKey);
        this.accounts = new ServiceProxy(connection, 'Accounts.Service');
    }

    _getPayloadTemplate(templateName, templateContent, subject, tags, clientName, clientEmail, mergeVars) {
        return {
            key: Config.mandrillApiKey,
            template_name: templateName,
            template_content: templateContent || [],
            message: {
                subject: subject,
                from_email: Config.mandrillFromEmail,
                from_name: Config.mandrillFromName,
                to: [{email: clientEmail, name: clientName, type: 'to'}],
                headers: {'Reply-To': Config.mandrillReplyToEmail},
                important: false,
                merge: true,
                merge_language: 'mailchimp',
                merge_vars: mergeVars || [],
                global_merge_vars: [{name: 'name',content: ''}],
                tags:tags || []
            },
            async: false,
            ip_pool: 'Main Pool',
            send_at: ''
        }
    }    

    sendMandrillTemplate(request) {
        return new Promise((resolve, reject) => {
            this.mandrillClient.messages.sendTemplate({
                template_name: request.template_name, 
                template_content: request.template_content, 
                message: request.message, 
                async: !!request.async, 
                ip_pool: request.ip_pool || 'Main Pool',
                send_at: request.send_at ? request.send_at : null
            }, resolve, reject);
        });
    }
    
    sendResetPasswordEmail(request) {
        return new Promise(resolve => {
            if (!request.account_id) throw new Errors.AccountIdRequired();
            resolve();
        }).then(() => {
            return this.accounts.getAccountById({account_id: request.account_id})            
        }).then(account => {
            var clientName = `${account.last_name} ${account.first_name}`;
            var mergeVars = [
                {name: 'name', content: clientName},
                {name: 'password', content: '********'}];
                
            var payload = this._getPayloadTemplate('reset-password', null,
                'Password Reset', 
                ['password-reset'], clientName, account.email, mergeVars);
            
            return this.sendMandrillTemplate(payload);
        });   
    }
    
    sendWelcomeEmail(request) {
        return new Promise(resolve => {
            if (!request.account_id) throw new Errors.AccountIdRequired();
            resolve();        
        }).then(() => {
            return this.accounts.getAccountById({account_id: request.account_id});
        }).then(account => {
            var clientName = `${account.last_name} ${account.first_name}`;
            var mergeVars = [
                {name: 'name', content: clientName},
                {name: 'password', content: '********'}];
                
            var payload = this._getPayloadTemplate('welcome-sign-up', null,
                'Welcome to Fundbird - Helping you find your business loan!', 
                ['welcome', 'sign-up'], clientName, account.email, mergeVars);
                
            return this.sendMandrillTemplate(payload);
        });
    }
    
    sendIframeWelcomeEmail(request) {
        return new Promise(resolve => {
            if (!request.account_id) throw new Errors.AccountIdRequired();
            resolve();        
        }).then(() => {
            return this.accounts.getAccountById({account_id: request.account_id})            
        }).then(account => {
            var clientName = `${account.last_name} ${account.first_name}`;
            var mergeVars = [
                {name: 'name', content: clientName},
                {name: 'password', content: '********'}];
                
            var payload = this._getPayloadTemplate('sb-welcome-email', null,
                'Welcome to Fundbird', 
                ['welcome', 'sign-up', 'iframe'], clientName, account.email, mergeVars);
                
            return this.sendMandrillTemplate(payload);
        });
    }
    
    send24HoursReminderEmail(request) {
        var templateName;
        return new Promise(resolve => {
            if (!request.account_id) throw new Errors.AccountIdRequired();
            if (!request.lender_id) throw new Errors.LenderIdRequired();

            switch (request.lender_id) {
                case 2:  templateName = 'fleximize-retention-24hrs'; break;
                case 3:  templateName = 'iwoca-retention-24hrs'; break;
                case 6:  templateName = 'fundingcircle-24hrs'; break;
                case 9:  templateName = 'crowdcube-retention-24hrs'; break;
                case 10: templateName = 'liberis-retention-24hrs'; break;
                case 11: templateName = 'ebury-24hrs'; break;
                case 12: templateName = 'marketinvoice-retention-24hrs'; break;
                case 13: templateName = 'crowdcube-retention-24hrs'; break;
                case 19: templateName = 'merchantmoney-retention-24hrs'; break;
                case 22: templateName = 'capitalontap-retention-24hrs'; break;
                case 23: templateName = 'yesgrowth-24hrs'; break;
                case 24: templateName = 'growthstreet-24hrs'; break;
                case 25: templateName = 'fundinginvoice-24hrs'; break;
                default: 
                    logger.error(`failed finding 24h email template for lender id ${request.lender_id}`);
                    throw new Errors.InvalidEmailTemplateName();
            };
            resolve();            
        }).then(() => {
            return this.accounts.getAccountById({account_id: request.account_id});
        }).then(account => {
            var clientName = `${account.last_name} ${account.first_name}`;
            var templateContent = [
                {name: 'fname', content: clientName},
                {name: 'uid', content: account.id}
            ]

            var mergeVars = [
                {
                    rcpt: clientName, 
                    vars: templateContent
                }
            ];
            
            var payload = this._getPayloadTemplate(templateName, templateContent,
                 `${clientName}, Don't miss the opportunity to get funding for your business`, 
                ['24h'], clientName, account.email, mergeVars);
                
            return this.sendMandrillTemplate(payload);
        });        
    }
}

module.exports = NotificationsService;
