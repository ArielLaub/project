'use strict'

var Promise = require('bluebird');
var Defs = require('./definitions');
var Errors = require('../../errors');
var bramqp = require('bramqp');
var URL = require('url');
var QS = require('querystring');
var EventEmitter = require('events').EventEmitter;
var Config = require('../../config');
var utils = require('../../utils');
var GeneralError = utils.error.GeneralError;
var logger = utils.logger.create('bus.connection');

class Connection extends EventEmitter {    
    constructor() {
        super();
        this._channel = 1;              //highest channel assigned by this connection
        this._recycledChannels = [];    //channels that were closed can be re-assigned
        this._handle = null;            //the bramqp handle
        this._connected = false;
    }
    
    get isConnected() { return this._connected };
    
    connect(protocol, hostName, port, vhost, username, password) {
        if (this._connected) throw new Errors.AlreadyInitialized();
        if (!protocol) protocol = 'amqp:';
        if (!hostName) hostName = 'localhost';
        if (!port) port = protocol === 'amqp:' ? 5672 : 5671;
        if (!vhost) vhost = '/';
        if (!username) username = 'guest';
        if (!password) password = 'guest';
                
        logger.info(`connecting to bus on ${protocol}//${username}:${password}@${hostName}:${port}${vhost}`);

        var sock, lib;
        lib = require(protocol === 'amqp:' ? 'net' : 'tls');
        sock = new lib.Socket();
        sock.once('error', (err) => {
            this._connected = false;
            this.emit('disconnected', {});
            logger.error(`message bus error - ${err}`);
            logger.info('will retry in 5 seconds.');
            setTimeout(() => {
                logger.info('reconnecting to the message bus...');
                return this.connect(protocol, hostName, port, vhost, username, password);
            }, 5000);
        });
        sock.connect({ host: hostName, port: port });

        return Promise.promisify(bramqp.initialize)(sock, Defs.SPEC_FILE_PATH).then(handle => {
            logger.info('connected to message bus');
            this._handle = handle;
            this._channel = 1;
            handle.once('error', (err) => { //reconnect on error
                logger.error(`bus connection\n - ${err.stack ? err.stack : err}`);
                if (err instanceof Error)
                    throw err;
                else
                    throw new Errors.ConnectionError(err);
            });
            
            return Promise.promisify(handle.openAMQPCommunication.bind(handle))(username, password, true, vhost);
        }).then(() => {
            logger.info('connection initialized.');
            this._connected = true;
            this.emit('connected', {});
        });
    }

    connectUrl(url) {
        if (!url) url = Config.amqpConnectionString;
        var parts = URL.parse(url);
        var vhost = (parts.pathname && parts.pathname != '/') ? QS.unescape(parts.pathname.substr(1)) : '/';
        return this.connect(parts.protocol, parts.hostname, parts.port, vhost, ...parts.auth.split(':'));
    }

    disconnect() {
        let handle = this._handle;
        handle.on('error', (error) => { 
            logger.error(`ingnoring error while disconnecting - ${error.message}`);
        });
        return Promise.promisify(handle.closeAMQPCommunication).bind(handle)().then(() => {
            handle.socket.destroy();
            this._connected = false;
            this.emit('disconnected', {});
        });
    }
    
    channelOpen() {
        return new Promise((resolve, reject) => {
            let channel = this._recycledChannels.shift() || ++this._channel;
            let handle = this._handle;

            handle.channel.open(channel);

            handle.once(`${channel}:channel.open-ok`, () => {
                logger.info(`channel ${channel} opened`);
                handle.basic.qos(channel, 0, 1, false);
                handle.once(`${channel}:basic.qos-ok`, (channel, method, data) => {
                    resolve(channel);
                });
            });
        });
    }
    
    channelClose(channel) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;

            handle.channel.close(channel, 200, 'OK');

            handle.once(`${channel}:channel.close-ok`, () => {
                logger.info(`channel ${channel} closed`);
                //this caused double messages after reopening a channel.
                //rabbit shows only 1 queued message but I received 2. I suspect a bramqp bug
                //for now always using a new channel solves it and we have 64k channels per connection.
                //this._recycledChannels.push(channel);

                resolve();
            });
        });   
    }
    
    exchangeDeclare(channel, exchangeName, exchangeType, passive, durable, autoDelete, internal, noWait, args) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;
            handle.exchange.declare(channel, exchangeName, exchangeType, passive, durable, autoDelete, internal, noWait, args || {});
            handle.once(`${channel}:exchange.declare-ok`, (channel, method, data) => {
                logger.info(`${exchangeType} exchange "${exchangeName}" declared`);
                return resolve(exchangeName, exchangeType);
            });
        });
    }

    queueDeclare(channel, queueName, passive, durable, exlusive, autoDelete, noWait, args) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;
            handle.queue.declare(channel, queueName, passive, durable, exlusive, autoDelete, noWait, args || {});
            handle.once(`${channel}:queue.declare-ok`, (channel, method, data) => {
                logger.info(`queue "${data.queue}" declared`);
                resolve(data.queue);
            });
        });
    }

    queueBind(channel, queueName, exchangeName, routingKey, noWait, args) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;

            handle.queue.bind(channel, queueName, exchangeName, routingKey, noWait, args || {});
            handle.once(`${channel}:queue.bind-ok`, (channel, method, data) => {
                logger.info(`${queueName} queue bound "${routingKey}" <=> "${exchangeName}"`);
                resolve();
            });
        });
    }

    queueDelete(channel, queueName) {
        return new Promise((resolve, reject) => {
            var handle = this._handle;
            handle.queue.delete(channel, queueName);
            handle.once(`${channel}:queue.delete-ok`, (messageCount) => {
                logger.info(`queue "${queueName}" deleted`);
                resolve();
            });            
        });
    }
    
    basicAck(channel, deliveryTag, multiple) {
        return new Promise((resolve, reject) => {
            this.handle.basic.ack(channel, deliveryTag, multiple);
            resolve();
        });
    }
    
    basicReject(channel, deliveryTag) {
        return new Promise((resolve, reject) => {
            this.handle.basic.ack(channel, deliveryTag);
            resolve();
        });        
    }
    
    basicConsume(channel, queueName, consumerTag, noLocal, noAck, exclusive, noWait, args, messageHandler) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;
            
            handle.basic.consume(channel, queueName, consumerTag, noLocal, noAck, exclusive, noWait, args || {});
            handle.once(`${channel}:basic.consume-ok`, (_channel, method, data) => {
                logger.info(`created consumer ${data['consumer-tag']} for queue ${queueName} on channel ${channel}`);
                handle.on(`${channel}:basic.deliver`, (_channel, method, data) => {
                    handle.once('content', (_channel, className, properties, content) => {
                        if (_channel != channel) return;

                        let replyTo = properties['reply-to'];
                        let correlationId = properties['correlation-id'];

                        logger.info(`incoming message: ${JSON.stringify(data)}`);                     
                        //for now we early ack everythig to eliminate any deadlocks.
                        if (!noAck)
                            handle.basic.ack(channel, data['delivery-tag']);
                            
                        messageHandler(content, correlationId).timeout(Defs.MESSAGE_PROCESSING_TIME_LIMIT).then((result) => {                            
                            
                            if (replyTo) {
                                let p = {
                                    'content-type': 'application/octet-stream',
                                    'correlation-id': correlationId
                                };
                                return this.publishMessage(channel, Defs.CALLBACKS_EXCHANGE_NAME, replyTo, result, p);
                            }  
                        }).catch(Promise.TimeoutError, err => {
                            logger.error(`message ${correlationId} timed out`);
                            handle.basic.reject(channel, data['delivery-tag']);
                        }).catch(err => {
                            logger.error(`caught unrecognized error ${err.message || err}:\n${err.stack}`);
                        });
                    });
                });
                resolve(data['consumer-tag']);
            });
        });
    }
    
    basicCancel(channel, consumerTag) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;
            handle.basic.cancel(channel, consumerTag);
            handle.once(`${channel}:basic.cancel-ok`, () => {
                logger.info(`cancelled consumer ${consumerTag}  on channel ${channel}`);
                resolve();
            });            
        })
    }
    
    queuePurge(channel, queueName, noWait) {
        return new Promise((resolve, reject) => {
            let handle = this._handle;
            handle.queue.purge(channel, queueName, noWait);
            handle.once(`${channel}:queue.purge-ok`, () => {
                logger.info(`purged queue ${queueName} on channel ${channel}`);
                resolve();                
            });
        });
    }
    publishMessage(channel, exchangeName, routingKey, content, properties) {
        var messageId = properties && properties['correlation-id'] ? properties['correlation-id'] : 'none';
        var replyTo = properties && properties['reply-to'] ? properties['reply-to'] : 'none';
        logger.info(`publish message "${messageId}":\n exchange: "${exchangeName}"
    routing-key: "${routingKey}"
    reply to: "${replyTo ? replyTo : 'none'}"`);
        
        return new Promise((resolve, reject) => {
            this._handle.basic.publish(channel, exchangeName, routingKey, false, false, properties, content, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

module.exports = Connection;
