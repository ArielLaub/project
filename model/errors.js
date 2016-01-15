'use strict'

var E = require('../utils/error').E;

var code = 200000; //amqp connection errors
module.exports.WrongEmailOrPassword           = E(code++, 'wrong email or password');

 
