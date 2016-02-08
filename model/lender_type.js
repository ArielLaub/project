var Promise  = require('bluebird');
var bookshelf = require('./bookshelf');
var utils  = require('../utils');
var logger = utils.logger.create('model.lender_type');
var Errors = require('../errors');

const TABLE_NAME = 'company_types';
var LenderType = bookshelf.Model.extend({
    tableName: TABLE_NAME,

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
    },
    
    exToJSON: function() {
        var json = this.toJSON();
        json.drawbacks = JSON.parse(json.drawbacks);
        json.benefits = JSON.parse(json.benefits);
        return json;
    }   
}, 
{            
    tableName: TABLE_NAME,

    getLenderTypeById: Promise.method(function(id) {
        return new this({id: id}).fetch({require: true}).then(type => {
            return type.exToJSON();
        });
    }),
    
    
});

module.exports = LenderType;