'use strict' 

class GeneralError extends Error{
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.message = message || this.name; 
    this.code = code;
    Error.captureStackTrace(this, this.constructor.name)
  }
}

function E(code, defaultMessage) {
    class PlatformError extends GeneralError {
        constructor(message) {
            super(message || defaultMessage, code);
        }
    };
    return PlatformError;
}
module.exports.E = E;
module.exports.GeneralError = GeneralError;