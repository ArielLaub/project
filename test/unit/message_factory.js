var chai = require('chai');
var utils = require('../../utils');
var factory = require('../mocks/message_factory');
var GeneralError = utils.error.GeneralError;

var expect = chai.expect;

describe('Message Factory', () => {
    var testRequestData = {
        name: 'Ariel Laub',
        desc: 'Really awesome guy',
        important: true,
        price: 9.99,
        quantity: 1
    };
    var testResponseData = {
        name: 'Naomi Laub',
        age: 5,
        validated: true,
        score: 90.4
    }
           
    it( 'should build a test request message', done => {
        var request = factory.buildRequest('Test.TestService.testMethod', testRequestData);
        expect(request).to.have.property('method', 'Test.TestService.testMethod');
        expect(request).to.have.property('data');
        
        var message = factory.decodeMessage('Test.Test', request.data);
        expect(message).to.have.property('name', 'Ariel Laub');
        expect(message).to.have.property('desc', 'Really awesome guy');
        expect(message).to.have.property('important', true);
        expect(message).to.have.property('price', 9.99);
        expect(message).to.have.property('quantity', 1);
        done();
    });
    
    it('should decode a request message', done => {
        var buffer = factory.buildRequest('Test.TestService.testMethod', testRequestData).encode().toBuffer();
        var request = factory.decodeRequest(buffer);
        expect(request).to.have.property('method', 'Test.TestService.testMethod');
        expect(request).to.have.property('data');
       
        var message = request.message;
        expect(message).to.have.property('name', 'Ariel Laub');
        expect(message).to.have.property('desc', 'Really awesome guy');
        expect(message).to.have.property('important', true);
        expect(message).to.have.property('price', 9.99);
        expect(message).to.have.property('quantity', 1);
        done();
    });
    
    it('should build a test response message', done => {
        var response = factory.buildResponse('Test.TestService.testMethod', testResponseData);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('method', 'Test.TestService.testMethod');
        expect(response.result).to.have.property('data');
        
        var message = factory.decodeMessage('Test.TestResult', response.result.data);
        expect(message).to.have.property('name', 'Naomi Laub');
        expect(message).to.have.property('age', 5);
        expect(message).to.have.property('validated', true);
        expect(message).to.have.property('score', 90.4);
        done();        
    });
    
    it('should decode a response message', done => {
        var buffer = factory.buildResponse('Test.TestService.testMethod', testResponseData).encode().toBuffer();
        var response = factory.decodeResponse(buffer);
        expect(response).to.have.property('value', 'result');
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('method', 'Test.TestService.testMethod');
        expect(response.result).to.have.property('data');
        
        var message = response.result.message;
        expect(message).to.have.property('name', 'Naomi Laub');
        expect(message).to.have.property('age', 5);
        expect(message).to.have.property('validated', true);
        expect(message).to.have.property('score', 90.4);
        done();         
    });

    it('should build an error response message', done => {
        var response = factory.buildResponse('Test.TestService.testMethod', new GeneralError('stam', 1));
        expect(response).to.have.property('value', 'error');
        expect(response).to.have.property('error');
        expect(response.error).to.have.property('message', 'stam');
        expect(response.error).to.have.property('code', 1);
        done();        
    });
    
    it('should decode an error response message', done => {
        var buffer = factory.buildResponse('Test.TestService.testMethod', new GeneralError('stam', -21)).encode().toBuffer();
        var response = factory.decodeResponse(buffer);
        expect(response).to.have.property('value', 'error');
        expect(response).to.have.property('error');
        expect(response.error).to.have.property('message', 'stam');
        expect(response.error).to.have.property('code', -21);
        done();         
    });

});