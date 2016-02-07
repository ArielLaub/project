(function () {
    'use strict';

    function configBlock($stateProvider) {

        $stateProvider
            .state('root', {
                abstract: true,
                templateUrl: 'app/modules/common/templates/layout.html',
                controller: 'commonController',
                controllerAs: 'vm'
            })
    }

    angular
        .module('common')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider'];

})();
