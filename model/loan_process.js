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
        
        //TODO: mysql doesn't support json natively remove once we move to mongo
        try {if (json.form_fields) json.form_fields = JSON.parse(json.form_fields);} catch(e) {}
        try {if (json.results) json.results = JSON.parse(json.results);} catch(e) {}
        try {if (json.has_offers_data) json.has_offers_data = JSON.parse(json.has_offers_data);} catch(e) {}
        
        return json;     
    }
}, 
{   
    tableName: TABLE_NAME,

    create: function(accountId, answers, formFields, results, ip) {
        return new Promise(resolve => {
            if (!accountId) return new Errors.AccountIdRequired();
                        
            //some conversions for backwards compatibility with the old app
            formFields.answer = answers
            resolve();            
        }).then(() => {
            return this.getLastByAccountId(accountId);
        }).then(lastProcess => {
            var fields = {
                created_at: new Date(),
                form_fields: JSON.stringify(formFields),
                results: JSON.stringify(results),
                ip: ip || 'N/A'
            };
            fields[ACCOUNT_ID_FIELD] = accountId;
            fields[PROCESS_ID_FIELD] = lastProcess ? lastProcess.process_id + 1 : 1;
            return (new this).save(fields);  
        }).then(process => {
            return process.exToJSON();
        });
    },      
    
    getLastByAccountId: function(accountId) {
        return new Promise(resolve => {
            if (!accountId) return new Errors.AccountIdRequired();          
            resolve();
        }).then(() => {
            return new this().query(qb => {
                qb.where(ACCOUNT_ID_FIELD, '=', accountId);
                qb.orderBy('id','DESC');
            }).fetch({require: false});
        }).then(process => {   
            return process ? process.exToJSON() : null;
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
            updated_at: new Date(),
            status: this.STATUS_CONVERTED
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
    },
    
    getByStatus: function(status, pageSize, pageIndex) {
        return new this().query(qb => {
            qb.where('status', '=', status);
            if (pageSize)
                qb.limit(pageSize);
            if (pageIndex)
                qb.offset(pageSize*pageIndex);
                
            qb.orderBy('updated_at', 'DESC');
        }).fetchAll({require: false}).then(processes => {
            var results = [];
            if (processes && processes.length > 0) {
                processes.forEach(process => {
                    results.push(process.exToJSON());
                });
            }
        });
    },
    
    setStatusSafe: function(id, oldStatus, status) {
        return new this({id: id, status: oldStatus}).save({status: status});
    },

    STATUS_NEW: 0,
    STATUS_REMINDED: 1,
    STATUS_ALERTED: 2,
    STATUS_CONVERTED: 3,
    STATUS_ARCHIVED: 4

});

module.exports = LoanProcess;