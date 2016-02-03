'use strict'

var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.loan_process');
var Errors = require('../errors');
var Account = require('./lender');

const ACCOUNT_ID_FIELD = 'user_id';
const PROCESS_ID_FIELD = 'process_id';

const TABLE_NAME = 'users_processes';

var LoanProcess = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    account: function() {
        return this.hasOne(Account, ACCOUNT_ID_FIELD);
    },
    
    exToJSON: function() {
        var json = this.toJSON();
        
        try {if (json.form_fields) json.form_fields = JSON.parse(json.form_fields);} catch(e) {}
        try {if (json.answer) json.answer = JSON.parse(json.answer);} catch(e) {}
        try {if (json.results) json.results = JSON.parse(json.results);} catch(e) {}
        try {if (json.has_offers_data) json.has_offers_data = JSON.parse(json.has_offers_data);} catch(e) {}
        
        return json;     
    }
}, 
{   
    create: function(accountId, answers, formFields, results, ip) {
        return new Promise(resolve => {
            if (!accountId) return new Errors.AccountIdRequired();
                        
            //some conversions for backwards compatibility with the old app
            formFields.answer = {};
            answers.forEach(answer => {
                formFields.answer[String(answer.question_id)] = String(answer.answer_id);
            });
            formFields.business_bank_acount = formFields.business_bank ? '1' : '';
            formFields.business_credit_card = formFields.business_credit_card ? '1' : '';
            formFields.customers_other_businesses = formFields.customers_other_businesses ? '1' : '';
            formFields.revenues_over_5m = formFields.revenues_over_5m ? '1' : '';
            formFields.process_over_4k = formFields.process_over_4k ? '1' : '';
            resolve();            
        }).then(() => {
            return new this().query(qb => {
                qb.where(ACCOUNT_ID_FIELD, '=', accountId)
                qb.orderBy('id','DESC');
            }).fetch({require: false});
        }).then(lastProcess => {
            var fields = {
                created_at: new Date(),
                form_fields: JSON.stringify(formFields),
                results: JSON.stringify(results),
                ip: ip || 'N/A'
            };
            fields[ACCOUNT_ID_FIELD] = accountId;
            fields[PROCESS_ID_FIELD] = lastProcess ? lastProcess.get('process_id') + 1 : 1;
            return (new this).save(fields);  
        }).then(process => {
            return process.exToJSON();
        });
    },      
    
    getLastByAccountId: function(accountId) {
        return new Promise(resolve => {
            if (!accountId) return new Errors.AccountIdRequired();          
            
        }).then(() => {
            var filter = {};
            filter[ACCOUNT_ID_FIELD] =  accountId;
            return new this(filter).fetch({withRelated: ['account'], require: true}).then(result => {
                return result.exToJSON();
            });
        });
    },
    
    getByAccountAndProcessId: function(accountId, processId) {
        var filter = {};
        filter[ACCOUNT_ID_FIELD] = accountId;
        filter[PROCESS_ID_FIELD] = processId;
        return new this(filter).fetch({require: true}).then(result => {
            return result.exToJSON();
        });
    },
    
    setHasOffersData: function(accountId, processId, hasOffersData) {
        var filter = {};
        filter[ACCOUNT_ID_FIELD] = accountId;
        filter[PROCESS_ID_FIELD] = processId;
        var process = new this();
        return process.where(filter).save({
            has_offers_data: JSON.stringify(hasOffersData),
            updated_at: new Date()
        }, {
            require: true,
            method: 'update'
        });
    },
    
    getLastConvertedTime: function() {
        return new this().query(qb => {
                qb.whereNotNull('has_offers_data');
                qb.orderBy('updated_at','DESC');
            }).fetch({require: false}).then(process => {
                if (process && process.get('updated_at')) {
                    return process.get('updated_at');
                } else {
                    return new Date(0);
                }
            });
    }
});

module.exports = LoanProcess;