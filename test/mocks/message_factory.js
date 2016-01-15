var ProtoBuf = require('protobufjs');
var MessageFactory = require('../../bus/message_factory');
var factory = new MessageFactory();

ProtoBuf.loadProtoFile('./test/mocks/test_service.proto', null, factory.builder);
factory.init();
MessageFactory.singleton = factory;

module.exports = factory;
