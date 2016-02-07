(function () {
    'use strict';

    function homeController($scope, $state, loanOptionsService, authService) {
        var vm = this;

        vm.authModel = authService.model;

        vm.homeFormSubmit = function() {
            if ($scope.homeForm.$valid) {
              if (vm.authModel.loggedIn) {
                $state.go('root.loan-options');
              }
              else {
                $state.go('root.register');
              }
            }
            else {
                $scope.homeForm.submitted = true;
            }
        };

        if ($state.current.name === 'root.home-step1' && vm.authModel.loggedIn) {
          $state.go('root.loan-options');
        }

        vm.loanOptionsModel = loanOptionsService.model;
        vm.fieldOptions = loanOptionsService.fieldOptions;

    }

    angular
        .module('home')
        .controller('homeController', homeController);

    homeController.$inject = ['$scope', '$state', 'loanOptionsService', 'authService'];

})();