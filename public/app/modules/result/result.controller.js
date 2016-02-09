(function () {
  'use strict';

  function resultController($scope, $state, loanOptionsService, authService, localStorageService) {
    var vm = this;

    vm.resultModel = loanOptionsService.model;
    
    vm.authModel = authService.model;

    if (!vm.resultModel[0]) {
        alert('we have no matching offers...');
        $state.go('root.loan-options');
    } else {
        for(var i = 0; i < vm.resultModel.length; ++i)
            if (typeof vm.resultModel[i].logo === 'string')
                vm.resultModel[i].logo = vm.resultModel[i].logo.replace('jpg', 'png');
            else
                vm.resultModel[i].logo = '';
    }

    vm.moreInfo = {};

    vm.moreInfoToggle = function (company_id) {
      vm.moreInfo[company_id] = true;
    };
  }

  angular
    .module('result')
    .controller('resultController', resultController);

  resultController.$inject = ['$scope', '$state', 'loanOptionsService', 'authService', 'localStorageService'];

})();