'use strict'

var E = require('./utils/error').E;

var code = 100000; //amqp connection errors
module.exports.InternalError           = E(code++, 'internal error');
module.exports.ConnectionError         = E(code++, 'connection error');
module.exports.NotConnected            = E(code++, 'not connected');
module.exports.ConnectionRequired      = E(code++, 'connection required');
module.exports.NotInitialized          = E(code++, 'not initialized');
module.exports.AlreadyInitialized      = E(code++, 'already initialized');
module.exports.AlreadyStarted          = E(code++, 'already started');
module.exports.LoggerRequired          = E(code++, 'logger required');
module.exports.ExchangeRequired        = E(code++, 'exchange required');
module.exports.NotDefinedAsConsumer    = E(code++, 'not defined as consumer');
module.exports.NotDefinedAsProducer    = E(code++, 'not defined as producer');
module.exports.AlreadySubscribed       = E(code++, 'already subscribed');
module.exports.NotSubscribed           = E(code++, 'not subscribed');
module.exports.InvalidRequest          = E(code++, 'invalid request');
module.exports.InvalidResponse         = E(code++, 'invalid response');
module.exports.InvalidServiceName      = E(code++, 'invalid service name');
module.exports.InvalidServiceMethod    = E(code++, 'invalid service method');
module.exports.ResponseResultNotParsed = E(code++, 'response result not parsed correcty');

var code = 200000; //services errors
module.exports.EmailAlreadyExists             = E(code++, 'email already exists');
module.exports.WrongEmailOrPassword           = E(code++, 'invalid credentials');
module.exports.InvalidEmailTemplateName       = E(code++, 'invalid mandrill template name'); 
module.exports.AccountIdRequired              = E(code++, 'account id required');
module.exports.LenderIdRequired               = E(code++, 'lender id required');
module.exports.AnswersRequired                = E(code++, 'answers required');
module.exports.ProcessIdRequired              = E(code++, 'process id required');