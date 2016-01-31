var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.lender_type');
var Errors = require('../errors');
var Lender = require('./lender');

var LenderType = bookshelf.Model.extend({
    tableName: 'company_types',

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    lenders: function() {
        return this.hasMany(Lender);
    }
}, 
{            
    getLenderTypeById: Promise.method(function(id) {
        return new this({id: id}).fetch({withRelated: ['lenders'], require: true});
    })
})

module.exports = LenderType;