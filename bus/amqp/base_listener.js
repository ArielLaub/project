'use strict'

var Errors = require('../../errors');
var cuid = require('cuid');
var EventEmitter = require('events').EventEmitter;

class BaseListener extends EventEmitter { //abstract
    constructor(connection, logger) {
        super();
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

        //re-init upon reconnection.
        connection.once('disconnected', () => {
            //check if listener was previously initialized.
            if (this.channel > 0) {
                this.channel = 0;
                logger.warn(`listener on ${this.queueName} disconnected`);
                connection.once('connected', () => {
                    logger.info(`listener on ${this.queueName} reconnected`);
                    this.init(this.handler, this.queueName).then(() => {
                        //check if listener was previsouly started.
                        if (this.consumerTag) {
                            this.consumerTag = '';
                            this.start();
                        }
                    });
                });                
            }
        });         
    }
    
    get isConnected() { return this.connection.isConnected };

    init(messageHandler, queueName) {
        return new Promise(resolve => {
            if (this.channel) return;
            if (!this.exchangeName) return new Errors.ExchangeRequired();
            if (!this.connection.isConnected) return new Errors.NotConnected();

            this.handler = messageHandler;       
            this.isAnonymous = !queueName;
            resolve();         
        }).then(() => {
            return this.connection.channelOpen()
        }).then(channel => {
            this.channel = channel;
            return this.connection.exchangeDeclare(channel, this.exchangeName, this.exchangeType, false, true, false, false, false);
        }).then(() => {
            return this.connection.queueDeclare(this.channel, queueName, false, !this.isAnonymous, this.isAnonymous, false, false, {})
        }).then(queueName => {
            this.queueName = queueName;
            //for direct exchange listeners we can go ahead and bind the queue.
            if (this.exchangeType === 'direct')
                return this.connection.queueBind(this.channel, queueName, this.exchangeName, queueName, false, {});            
        }).then(() => {
            this.emit('initialized', {});
        });
    }
    
    start() {
        return new Promise(resolve => {
            if (!this.channel) return new Errors.NotInitialized();
            if (this.consumerTag) return new Errors.AlreadyStarted();
            if (!this.connection.isConnected) return new Errors.NotConnected();            
            this.consumerTag = cuid();            
            resolve();
        }).then(() => {
            return this.connection.basicConsume(this.channel, this.queueName, this.consumerTag, false, this.isAnonymous, false, false, null, this.handler)
        }).then(() => {
            this.emit('started', {});
        });
    }
    
    close() {
        return new Promise(resolve => {
            if (!this.channel || !this.queueName) return new Errors.NotInitialized();
            if (!this.connection.isConnected) return new Errors.NotConnected();
            resolve();
        }).then(() => {
            return this.connection.basicCancel(this.channel, this.consumerTag)    
        }).then(() => {
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