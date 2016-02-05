var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.lender_type');
var Errors = require('../errors');
var Lender = require('./lender');

const TABLE_NAME = 'company_types';
var LenderType = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    lenders: function() {
        return this.hasMany(Lender);
    }
}, 
{            
    tableName: TABLE_NAME,

    getLenderTypeById: Promise.method(function(id) {
        return new this({id: id}).fetch({withRelated: ['lenders'], require: true});
    })
});

module.exports = LenderType;