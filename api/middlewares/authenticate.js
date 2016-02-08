'use strict'

var ServiceProxy = require('../../bus/service_proxy');

module.exports = function(connection) {
    var accountsService = new ServiceProxy(connection, 'Accounts.Service');
    
    return function(req, res, next) {
        var authHeader = req.headers['Authorization'] || req.headers['authorization'];
        var token = //req.body.access_token || 
                    //req.query.token || 
                    //req.headers['x-access-token'] || 
                    (authHeader && authHeader.slice(0,6).toUpperCase() === 'BEARER' ? 
                        authHeader.slice(6).replace(/\s+/g, '') : null);
        
        function _authenticate() {
            // decode token
            if (token) {
                // verifies secret and checks exp
                accountsService.verifyToken({access_token: token}).then(response => {
                    if (response.error)
                        return res.json({ success: false, error: response.error.message, code: response.error.code});

                    //req.decodedToken = response.decoded;
                    req.accountId = response.account_id;
                    next();            
                });
            } else {
                return res.status(401).send({ 
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