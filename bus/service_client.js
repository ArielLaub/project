'use strict'

var MessageDispatcher = require('./amqp/message_dispatcher');

class ServiceClient {
    constructor(connection, serviceName) {
        this.dispatcher = new MessageDispatcher(connection);
        this
    }
}