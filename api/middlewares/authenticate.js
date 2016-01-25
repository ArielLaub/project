'use strict'

var ServiceProxy = require('../../bus/service_proxy');

module.exports = function(connection) {
    var accountsService = new ServiceProxy(connection, 'Accounts.Service');
    
    return function(req, res, next) {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        function _authenticate() {
            // decode token
            if (token) {
                // verifies secret and checks exp
                accountsService.verifyToken({token: token}).then(response => {
                    if (response.error)
                        return res.json({ success: false, error: response.error.message, code: response.error.code});

                    req.decodedToken = response.result;
                    req.accountId = response.result.id;
                    next();            
                });
            } else {
                return res.status(403).send({ 
                    success: false, 
                    message: 'access denied' 
                });
            }            
        }
        
        if (accountsService.initialized) {
            _authenticate();
        } else {
            accountsService.init().then(() => {
                _authenticate();
            });
        }
    }
}