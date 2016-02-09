(function () {
  'use strict';

  function loanOptionsController($scope, loanOptionsService, authService, resultService, localStorageService) {
    var vm = this;

    vm.authModel = authService.model;
    vm.businessEstablish = true;
    vm.loanOptionsModel = loanOptionsService.model;
    vm.resultModel = resultService.model;

    $scope.$watch('vm.authModel.answer[4]', function (value) {
      if (value === "30") {
        vm.businessEstablished = false;
      }
      else {
        vm.businessEstablished = true;
      }
    });

    vm.loanOptionsFormSubmit = function () {
      if ($scope.loanOptionsForm.$valid) {

        // Set defaul values
        if (vm.authModel.answer[3] !== '30') {
          vm.authModel.business_bank_account = '1';
          vm.authModel.business_credit_card = '1';
        }
        else {
          vm.authModel.answer[5] = '36'
          vm.authModel.answer[6] = '37'
          vm.authModel.answer[2] = '15'
          vm.authModel.process_over_2500 = '1'
          vm.authModel.revenues_over_5m = '1'
          vm.authModel.personal_guarantee = '1'
          //vm.authModel.company_number = '72'
        }

        // Removes the commas
        vm.authModel.exact_loan_amount = vm.authModel.exact_loan_amount.replace(/,/g, '');

        if (localStorageService.get('affsub2')) {
          vm.authModel['affid'] = localStorageService.get('affsub2');
        }

        // If company type is llp or limited company, validate the company number field
        // TODO: make a custom directive
        if (vm.authModel.answer[6] === '38' || vm.authModel.answer[6] === '41') {
            loanOptionsService.validateCompanyNumber(
                vm.authModel.company_number, vm.authModel.company, vm.authModel.answer[4]).then(function(error) {
                    if (error) {
                        $scope.loanOptionsForm.companyNumber.capabilities.$setValidity("youAreFat", false);
                    }
                    return loanOptionsService.saveLoanOptions(vm.authModel);
                });
        } else {
            loanOptionsService.saveLoanOptions(vm.authModel);
        }
      }
      else {
        $scope.loanOptionsForm.submitted = true;
        $('.ng-invalid')[1].focus();
      }
    };

    vm.updateAnswerModel10 = function () {
      vm.authModel.answer[10] = '63';
      if (vm.authModel.process_over_2500 === '1' && vm.authModel.process_card === '1') {
        vm.authModel.answer[10] = '62';
      }
    };

    vm.fieldOptions = loanOptionsService.fieldOptions;

  }

  angular
    .module('loanOptions')
    .controller('loanOptionsController', loanOptionsController);

  loanOptionsController.$inject = ['$scope', 'loanOptionsService', 'authService', 'resultService', 'localStorageService'];

})();