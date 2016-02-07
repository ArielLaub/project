(function () {
  'use strict';

  function resultController($scope, $state, loanOptionsService, authService, localStorageService) {
    var vm = this;

    vm.resultModel = loanOptionsService.model;
    vm.authModel = authService.model;

    if (!vm.resultModel[0]) {
//      $state.go('root.loan-options');
    }

    vm.moreInfo = {};

    vm.moreInfoToggle = function (company_id) {
      vm.moreInfo[company_id] = true;
    };

    vm.addQueries = function(url) {
      var affsub5 = localStorageService.get('affsub5');
      var affsub2 = localStorageService.get('affsub2');
      return url + '&aff_sub5=' + affsub5 + '&aff_sub2=' + affsub2;
    };

  }

  angular
    .module('result')
    .controller('resultController', resultController);

  resultController.$inject = ['$scope', '$state', 'loanOptionsService', 'authService', 'localStorageService'];

})();