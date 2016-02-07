(function () {
    'use strict';

    function configBlock($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/home');
    }

    angular
        .module('app')
        .config(configBlock);

    configBlock.$inject = ['$stateProvider', '$urlRouterProvider'];

})();