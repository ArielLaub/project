(function () {
    'use strict';

    function configBlock($stateProvider) {

        $stateProvider
            .state('root.home', {
                url: '/home',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/home/templates/home.html',
                        controller: 'homeController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('root.home-step1', {
                url: '/home-step1',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/home/templates/home-step1.html',
                        controller: 'homeController',
                        controllerAs: 'vm'
                    }
                }
            });

    }

    angular
        .module('home')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider'];

})();
