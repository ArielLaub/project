(function () {
    'use strict';

    function configBlock($stateProvider) {

        $stateProvider
            .state('root.about', {
                url: '/about',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/static-pages/templates/about.html',
                        controller: 'staticPagesController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('root.type-of-loans', {
                url: '/type-of-loans',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/static-pages/templates/type-of-loans.html',
                        controller: 'staticPagesController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('root.loan-providers', {
                url: '/loan-providers',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/static-pages/templates/loan-providers.html',
                        controller: 'staticPagesController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('root.news', {
                url: '/news',
                views: {
                    'content@root': {
                        templateUrl: 'app/modules/static-pages/templates/news.html',
                        controller: 'staticPagesController',
                        controllerAs: 'vm'
                    }
                }
            });

    }

    angular
        .module('staticPages')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider'];

})();
