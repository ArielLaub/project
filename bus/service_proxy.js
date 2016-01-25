'use strict'
var ProtoBuf = require('protobufjs');
var MessageDispatcher = require('./amqp/message_dispatcher');
var factory = require('./message_factory').singleton;
var Errors = require('../errors');

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
                let request = factory.buildRequest(methodFullName, requestMessage);
                return this.dispatcher.publish(request.encode().toBuffer(), `REQUEST.${methodFullName}`, rpc)
                    .then(responseData => {
                        let response = factory.decodeResponse(responseData);
                        if (response.result && response.result.message)
                            response.result = response.result.message;
                        return response;                            
                    });
            };
        });

        return this.dispatcher.init().then(() => {
            this.initialized = true;
        });
    }
}

module.exports = ServiceProxy;
