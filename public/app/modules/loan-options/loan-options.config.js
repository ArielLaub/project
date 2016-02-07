(function () {
    'use strict';

    function configBlock($stateProvider) {

        $stateProvider
            .state('root.loan-options', {
                url: '/loan-options',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/loan-options/templates/loan-options.html',
                        controller: 'loanOptionsController',
                        controllerAs: 'vm'
                    }
                }
            });

    }

    angular
        .module('loanOptions')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider'];

})();