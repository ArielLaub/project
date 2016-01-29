'use strict'
var ProtoBuf = require('protobufjs');
var MessageDispatcher = require('./amqp/message_dispatcher');
var factory = require('./message_factory').singleton;
var Errors = require('../errors');
var utils  = require('../utils');
var logger = utils.logger.create('services.service_proxy');
var GeneralError = utils.error.GeneralError;

var _cacheByName = new Map();

class ServiceProxy {
    constructor(connection, serviceName) {
        //ensure we do not initiate more than one instance per type
        //we should instead reuse identical instances so we use a cache
        if (_cacheByName.has(serviceName)) 
            return _cacheByName.get(serviceName);
            
        this.dispatcher = new MessageDispatcher(connection);
        this.serviceName = serviceName;
        _cacheByName.set(serviceName, this);
    }
    
    init() {
        //if we return a cached proxy it will most likely already initialized
        if (this.initialized) return new Promise(resolve => {
            resolve();
        });
        
        var builder = factory.builder;
        var TService = builder.lookup(this.serviceName);
        if (!TService) 
            throw new Errors.InvalidServiceName();            

        var TMethods = TService.getChildren(ProtoBuf.Reflect.Service.RPCMethod); 
        TMethods.forEach(TMethod => {
            let methodFullName = `${this.serviceName}.${TMethod.name}`; //<package>.<service>.<method>
            this[TMethod.name] = (requestMessage, rpc) => {
                let request;
                try {
                    request = factory.buildRequest(methodFullName, requestMessage);
                } catch (error) {
                    logger.error(`failed building message '${TMethod.requestName}' from ${JSON.stringify(requestMessage)}\n${error}`);
                    throw new Errors.InvalidRequest('failed parsing message');
                }
                return this.dispatcher.publish(request.encode().toBuffer(), `REQUEST.${methodFullName}`, rpc)
                    .catch(error => {
                        logger.error(error);
                        throw new Errors.ConnectionError(`failed dispatching request to ${methodFullName}`);
                    })
                    .then(responseData => {
                        let response;
                        try {
                            response = factory.decodeResponse(responseData);
                        } catch (error) {
                            logger.error(error);
                            throw new Errors.InvalidResponse(`failed parsing result for ${methodFullName}`);
                        }
                        if (response.error)
                            throw new GeneralError(response.error.message, response.error.code);
                        
                        return response.result.message;
                    });                            
            };
        });

        return this.dispatcher.init().then(() => {
            this.initialized = true;
        });
    }
}

module.exports = ServiceProxy;
