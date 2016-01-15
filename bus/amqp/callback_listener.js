'use strict'

var BaseListener = require('./base_listener');
var Defs = require('./definitions');
var utils = require('../../utils');
var logger = utils.logger.create('bus.callback_listener');

class CallbackListener extends BaseListener {
    constructor(connection) {
        super(connection, logger);

        this.exchangeName = Defs.CALLBACKS_EXCHANGE_NAME;
        this.exchangeType = Defs.CALLBACKS_EXCHANGE_TYPE;
    }
    
    get callbackQueue() { return this.queueName }
}

module.exports = CallbackListener;