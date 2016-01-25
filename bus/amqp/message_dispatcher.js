'use strict'

var Promise = require('bluebird');
var CallbackListener = require('./callback_listener');
var Defs = require('./definitions');
var Errors = require('../../errors');
var cuid = require('cuid');
var utils = require('../../utils');
var logger = utils.logger.create('bus.message_dispatcher');

class MessageDispatcher {
    constructor(connection) {
        //no need to validate the connection callback listener will do it.
        this.connection = connection;
        this.channel = 1; //for now we'll use the default channel for publishing
        this.callbacks = new Map();
        this.callbackListener = new CallbackListener(connection);
    }
    
    _onResult(content, id) {
        return new Promise((resolve, reject) => {
            //if there is a waiting promise resolve/reject it
            if (this.callbacks.has(id)) {
                var callback = this.callbacks.get(id);
                this.callbacks.delete(id);
                callback.resolve(content);
            }
            resolve();            
        });
    }
    
    init() {
        return this.callbackListener.init(this._onResult.bind(this)).then(() => {
            return this.callbackListener.start();
        });
    }
    
    publish(content, routingKey, rpc) {
        if (rpc !== false) rpc = true;
        var id = cuid();
        var properties = {
            'content-type': 'application/octet-stream',
            'correlation-id': id, 
            'reply-to': rpc ? this.callbackListener.callbackQueue : null,
            'delivery-mode': 2 //persistent
        };
        //this is called syncronously and _onResult resolves/rejects it later
        
        return this.connection.publishMessage(this.channel, Defs.BUS_EXCHANGE_NAME, routingKey, content, properties)
            .then(() => {
                if (!rpc) return; //we are not expecting any result so resolve
                return new Promise((resolve, reject) => {                        
                    this.callbacks.set(id, {
                        resolve: result => {
                            logger.info(`received result for message ${id}`);
                            resolve(result);
                        }, 
                        reject: error => {
                            logger.info(`received error for message ${id} - ${error}`);
                            reject(error);
                        }
                    });   
            }).finally(() => {
                if (this.callbacks.has(id))
                    this.callbacks.delete(id);
            });
        });
    }   
}

module.exports = MessageDispatcher;