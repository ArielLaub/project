var Promise  = require('bluebird');
var bcrypt   = Promise.promisifyAll(require('bcrypt'));
var bookshelf = require('./bookshelf');
var Errors = require('./errors');

var Account = bookshelf.Model.extend({
    tableName: 'accounts',

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
        
        this.on('saving', this.validateSave);
        this.on('creating', this.hashPassword);
    },

    validateSave: function() {
    },

    hashPassword: function(model, attrs, options) {
         return bcrypt.hashAsync(model.attributes.password, 10).then(hash => {
             model.set('password', hash);
         });
    }
}, 
{
    //Class properties
    login: Promise.method(function(email, password) {
        if (!email || !password) throw new Error('Email and password are both required');
        return new this({email: email.toLowerCase().trim()}).fetch({require: true}).tap(function(account) {
            return bcrypt.compareAsync(password, account.get('password')).then(res => {
                if (!res) throw new Errors.WrongEmailOrPassword();
            });
        });
    })
});

module.exports = Account;