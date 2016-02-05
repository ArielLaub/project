'use strict'

var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.lender_type');
var Errors = require('../errors');
var Lender = require('./lender');

const TABLE_NAME = 'info_company_question';

var LenderPreference = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    lender: function() {
        return this.belondsTo(Lender, 'company_fk')
    }
}, 
{            
    tableName: TABLE_NAME,

    getByLenderId: function(lenderId) {
        return new this({company_fk: lenderId}).fetchAll({require: false});
    },
    
    getPositiveLenderIds: function(questionId, answerId) {
        return (new this)
            .query({where: {question_fk: questionId, answer_fk: answerId}})
            .fetchAll({require: false})
            .then(results => {
                if (!results || results.length === 0)
                    return [];
                
                let lenderIds = [];
                results.forEach(result => {
                    lenderIds.push(result.get('company_fk'));
                });
                return lenderIds;
            });
    }
});

module.exports = LenderPreference;