'use strict'

var BaseListener = require('./base_listener');
var Defs = require('./definitions');
var utils = require('../../utils');
var logger = utils.logger.create('bus.message_listener');

class MessageListener extends BaseListener {
    constructor(connection) {
        super(connection, logger);
        this.exchangeName = Defs.BUS_EXCHANGE_NAME;
        this.exchangeType = Defs.BUS_EXCHANGE_TYPE;
    }
        
    subscribe(topics) {
        if (typeof topics === 'string')
            topics = [topics];
                 
        return Promise.all(topics.map(topic => {
            return this.connection.queueBind(this.channel, this.queueName, this.exchangeName, topic, false);            
        }));
    }
}

module.exports = MessageListener;