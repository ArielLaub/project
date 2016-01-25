'use strict'

var Errors = require('../../errors');
var cuid = require('cuid');

class BaseListener { //abstract
    constructor(connection, logger) {
        if (!connection) throw new Errors.ConnectionRequired();
        if (!logger) throw new Errors.LoggerRequired();
        
        this.connection   = connection;
        this.queueName    = '';
        this.exchangeName = '';
        this.exchangeType = '';
        this.channel      = 0;
        this.consumerTag  = '';
        this.handler      = null;
        this.isAnonymous  = true;
        this.logger       = logger;
    }
    
    init(messageHandler, queueName) {
        if (this.channel) throw new Errors.AlreadyInitialized();
        if (!this.exchangeName) throw new Errors.ExchangeRequired();
        
        this.handler = messageHandler        
        this.isAnonymous = !queueName;
        
        return this.connection.channelOpen()
            .then(channel => {
                this.channel = channel;
                return this.connection.exchangeDeclare(channel, this.exchangeName, this.exchangeType, false, true, false, false, false);
            })
            .then(() => {
                return this.connection.queueDeclare(this.channel, queueName, false, !this.isAnonymous, this.isAnonymous, false, false, {})
            })
            .then(queueName => {
                this.queueName = queueName;
                //for direct exchange listeners we can go ahead and bind the queue.
                if (this.exchangeType === 'direct')
                    return this.connection.queueBind(this.channel, queueName, this.exchangeName, queueName, false, {});
                
            });
    }
    
    start() {
        if (!this.channel) throw new Errors.NotInitialized();
        if (this.consumerTag) throw new Errors.AlreadyStarted();
        this.consumerTag = cuid();
        return this.connection.basicConsume(this.channel, this.queueName, this.consumerTag, false, this.isAnonymous, false, false, null, this.handler);
    }
    
    close() {
        if (!this.channel || !this.queueName) throw new Errors.NotInitialized();
        return this.connection.basicCancel(this.channel, this.consumerTag)
            .then(() => {
                this.consumerTag = '';
                return this.connection.channelClose(this.channel)        
            })
            .then(() => {
                this.channel = 0;
                this.handler = null;
                this.queueName = '';
            });
    }
}

module.exports = BaseListener;