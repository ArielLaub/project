(function () {
    'use strict';

    function staticPagesController($scope, $log, $state, authService) {
        var vm = this;

        vm.authModel = authService.model;

    }

    angular
        .module('home')
        .controller('staticPagesController', staticPagesController);

    staticPagesController.$inject = ['$scope', '$log', '$state', 'authService'];

})();