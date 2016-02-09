(function () {
  'use strict';

  function commonController($scope, authService, $state, $location, localStorageService) {
    var vm = this;
    $scope.$state = $state;

    vm.authModel = authService.model;

    var queries = $location.search();
    
    if (!localStorageService.get('affiliateId')) {
      localStorageService.set('affiliateId', queries.aff_sub5);
    }

    if (!localStorageService.get('affiliateSubId')) {
      localStorageService.set('affiliateSubId', queries.aff_sub);
    }

    if (!localStorageService.get('referrerId')) {
        localStorageService.set('referrerId', queries.ref_id);
    }
    
    vm.homeStep1Done = function () {
      if (vm.authModel.exact_loan_amount && vm.authModel.answer[3] && vm.authModel.answer[4]) {
        return true;
      }
    };

    vm.checkedP = false;
    vm.checkedM = false;

    vm.toggleP = function () {
      vm.checkedM = false;
      vm.checkedP = !vm.checkedP
    };

    vm.toggleM = function () {
      vm.checkedP = false;
      vm.checkedM = !vm.checkedM
    };

    // Put a comma on the amount value
    $scope.$watch('vm.authModel.exact_loan_amount', function (value) {
      if (value) {
        vm.authModel.exact_loan_amount = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
    });

  }

  angular
    .module('common')
    .controller('commonController', commonController);

  commonController.$inject = ['$scope', 'authService', '$state', '$location', 'localStorageService'];

})();