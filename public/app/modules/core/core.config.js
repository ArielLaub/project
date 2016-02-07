(function () {
    'use strict';

    function configBlock($httpProvider) {

        var securityInterceptors = function($q, $location, localStorageService) {
            var headerTokenName = 'Authorization';
            var cookieTokenName = 'JWToken';

            return {
                'request': function interceptRequest (config) {
                    config.headers = config.headers || {};
                    config.headers[headerTokenName] = localStorageService.get(cookieTokenName);

                    return config;
                },

                'response': function interceptResponse(response) {
                    var lowercaseTokName = headerTokenName.toLowerCase();

                    if (lowercaseTokName in response.headers()) {
                        var token = response.headers()[lowercaseTokName];
                        if (token.trim() !== '') {
                            localStorageService.set(cookieTokenName, token);
                        }
                    }

                    return response;
                },

                'responseError': function (response) {
                    if (response.status >= 400 && response.status < 500 || response.status === 0) {
                        localStorageService.remove(cookieTokenName);
                        $location.path('/login');
                    }

                    return $q.reject(response);
                }
            };
        };

        // setup $http interceptors for token security
        $httpProvider.interceptors.push(securityInterceptors);
    }

    angular
        .module('core')
        .config(configBlock);

})();
