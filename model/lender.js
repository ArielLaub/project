'use strict'

var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.lender_type');
var Errors = require('../errors');
var LenderType = require('./lender_type');

const TABLE_NAME = 'company';

var Lender = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    lenderType: function() {
        return this.belongsTo(LenderType);
    }
}, 
{  
    tableName: TABLE_NAME,
              
    getLenderById: function(id) {
        return new this({id: id}).fetch({withRelated: ['lenderType'], require: true});
    },
    
    getAll: function(andFilters) {
        var query = {where: andFilters ? Object.apply({active: true}, andFilters) : {active: true}};
        return (new this())
            .query(query)
            .fetchAll().then(_results => {
                var results = _results.map(result => result.toJSON());
                return results;
            });            
    }
});

module.exports = Lender;