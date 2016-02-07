(function () {
    'use strict';

    function configBlock($stateProvider) {

        $stateProvider
            .state('root.result', {
                url: '/result',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/result/templates/result.html',
                        controller: 'resultController',
                        controllerAs: 'vm'
                    }
                }
            });

    }

    angular
        .module('result')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider'];

})();