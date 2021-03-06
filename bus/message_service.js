'use strict'

var Promise = require('bluebird');
var Errors = require('../errors');
var MessageListener = require('./amqp/message_listener');

var utils = require('../utils');
var logger = utils.logger.create('bus.message_service');
var GeneralError = utils.error.GeneralError;

var factory = require('./message_factory').singleton;

class MessageService {    
    constructor(connection, serviceName) {
        if (!connection) throw new Errors.ConnectionRequired();
        this.listener = new MessageListener(connection);
        this.serviceName = serviceName;
    }
    
    _onMessage(data, id) {
        return new Promise((resolve, reject) => {
            var request = factory.decodeRequest(data);
            if (!request) 
                reject(new Errors.InvalidRequest());
            resolve(request);
        }).then(request => {
            var method = request.method.split('.')[2]; //<package>.<service>.<method>
            if (this[method] && typeof this[method] === 'function')
                return this[method](request.message, id).then(result => {
                    return factory.buildResponse(request.method, result).encode().toBuffer();
                })
                .catch(error => {
                    if (!(error instanceof GeneralError))
                        logger.error(error);
                    return factory.buildResponse(request.method, error).encode().toBuffer();                
                });
            else {
                throw new Errors.InvalidServiceMethod(`invalid service method ${method}`)
            }            
        });
    }

    init() {
        return this.listener.init(this._onMessage.bind(this), this.serviceName)
            .then(() => {
                return this.listener.subscribe(`REQUEST.${this.serviceName}.*`);
            }).then(() => {
                return this.listener.start()
            }).catch((err) => {
                logger.error(`error initializing service ${this.serviceName} - ${err}\n${err.stack}`);
                throw err;
            });
    }
}

module.exports = MessageService;