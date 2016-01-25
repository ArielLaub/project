'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var Config = require('../config');
var Account = require('../model/account');

var utils  = require('../utils');
var logger = utils.logger.create('services.notifications_service');
var mandrill = require('mandrill-api/mandrill');

var _getPayloadTemplate = function() {
    return {
        "key": "",
        "template_name": "",
        "template_content": [],
        "message": {
            "subject": "",
            "from_email": "",
            "from_name": "",
            "to": [{"email": "","name": "","type": "to"}],
            "headers": {"Reply-To": ""},
            "important": false,"merge": true,
            "merge_language": "mailchimp",
            "merge_vars": [{"rcpt": "","vars": [{"name": "name","content": ""}]}],
            "global_merge_vars": [{"name": "name","content": ""}],
            "tags": ["welcome", "sign-up"]
        },
        "async": false,
        "ip_pool": "Main Pool",
        "send_at": ""
    }
}

var _populatePayload = function(payload, templateName, subject, tags, clientName, clientEmail, mergeVars) {
    payload.key = Config.mandrillApiKey;
    payload.template_name = templateName
    payload.message.subject = subject;
    payload.message.from_email = Config.mandrillFromEmail;
    payload.message.from_name = Config.mandrillFromName;
    payload.message.to[0].email = clientEmail;
    payload.message.to[0].name = clientName;
    payload.message.merge_vars[0].rcpt = clientEmail;
    payload.message.merge_vars[0].vars = mergeVars;
    payload.message.headers["Reply-To"] = Config.mandrillReplyToEmail
    payload.tags = tags;

    return payload;
}

class NotificationsService extends MessageService {
    constructor(connection, emailClient) {
        super(connection, 'Notifications.Service');
        this.mandrillClient = emailClient || new mandrill.Mandrill(Config.mandrillApiKey);
    }
    
    sendEmailTemplate(request) {
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
        var payload = _getPayloadTemplate();
        return Account.where({id: request.account_id}).fetch({require: true}).then(account => {
            account = account.toJSON();
            var clientName = account.last_name+' '+account.first_name
            var mergeVars = [
                {name: 'name', content: clientName},
                {name: 'password', content: account.reset_password_token}];
                
            _populatePayload(payload, 
                'reset-password', 'Password Reset', ['password-reset'], clientName, account.email, mergeVars);
            return this.sendEmailTemplate(payload);
        });   
    }
}

module.exports = NotificationsService;
