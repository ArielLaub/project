'use strict'

var path = require('path'), fs=require('fs');
var ProtoBuf = require('protobufjs');

var utils  = require('../utils');
var Errors = require('./errors');

var GeneralError = utils.error.GeneralError;
var logger = utils.logger.create('bus.message_factory');

function findFiles(startPath,filter, parentFiltered){
    var files=fs.readdirSync(startPath);
    var filtered = parentFiltered || [];
    var childDirs = [];
    files.forEach(filename => {
        let fullname = path.join(startPath, filename);
        let stat = fs.lstatSync(fullname);
        
        if (stat.isDirectory())
            childDirs.push(fullname);
        else if (filename.indexOf(filter) !== -1)
            filtered.push(fullname);
    });
    
    childDirs.forEach(fullname => {
        findFiles(fullname, filter, filtered);
    });
    
    return filtered;
};

class MessageFactory {
    constructor() {
        this.builder = null;
        this.request = null;
        this.response = null;
        this.cache = new Map();
        this.initialized = false;
        this.builder = ProtoBuf.newBuilder({ convertFieldsToCamelCase: true });
    }
    
    init() {
        logger.info('message factory initializing');
        const builder = this.builder; 
        const MESSAGES_ROOT_PATH = './bus/proto/';
        findFiles(MESSAGES_ROOT_PATH, '.proto').forEach(filename => {
            logger.info(`loading proto file ${filename}`)
            ProtoBuf.loadProtoFile(filename, null, builder);
        });
        
        this.builder = builder;
        this.Request = builder.build('Platform.RequestContainer');
        this.Response = builder.build('Platform.ResponseContainer');
        this.ResponseResult = builder.build('Platform.ResponseContainer.Result');
        this.ResponseError = builder.build('Platform.ResponseContainer.Error');
        
        this.initialized = true;
        logger.info('message factory initialized');
    }

    decodeMessage(messageType, data) {
        if (!this.initialized) throw new Errors.NotInitialized('message factory not initialized');
        if (!this.cache.has(messageType)) 
            this.cache.set(messageType, this.builder.build(messageType));

        var Message = this.cache.get(messageType);
        return Message.decode(data); 
    }
    
    buildRequest(method, obj) {
        if (!this.initialized) throw new Errors.NotInitialized('message factory not initialized');
        
        var TMethod = this.builder.lookup(method);
        var messageType = TMethod.requestName; 
        
        if (!this.cache.has(messageType)) 
            this.cache.set(messageType, this.builder.build(messageType));

        var Message = this.cache.get(messageType);
        return new this.Request({
            method: method,
            data: new Message(obj).encode().toBuffer()            
        });   
    }
    
    decodeRequest(data) {
        var request = this.Request.decode(data);
        var TMethod = this.builder.lookup(request.method);

        var messageType = TMethod.requestName; 
        request.message = this.decodeMessage(messageType, request.data);
        return request;
    }
        
    buildResponse(method, obj) {
        if (!this.initialized) throw new Errors.NotInitialized('message factory not initialized');
        var response = null;
        var TMethod = this.builder.lookup(method);
        var messageType = TMethod.responseName; 

        if (obj instanceof Error) {
            response = new this.Response();
            response.set('error', new this.ResponseError({
                method: method,
                message: obj.message,
                code: obj.code || -1
            }));         
        } else {
            if (!this.cache.has(messageType)) 
                this.cache.set(messageType, this.builder.build(messageType));
            let Message = this.cache.get(messageType);        
            response = new this.Response();
            response.set('result', new this.ResponseResult({
                method: method,
                data: new Message(obj).encode().toBuffer()
            }));                       
        }
        return response;
    }
    
    decodeResponse(data) {
        var response = this.Response.decode(data);
        if (response.error) {
            response.errorObject = new GeneralError(response.error.message, response.error.code);
        } else {
            let result = response.result;
            let TMethod = this.builder.lookup(result.method);
            let messageType = TMethod.responseName; 

            result.message = this.decodeMessage(messageType, result.data);
        }
        return response;
    }
}

module.exports = MessageFactory;

var singleton = new MessageFactory();
singleton.init();
module.exports.singleton = singleton;