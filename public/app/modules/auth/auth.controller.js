(function () {
  'use strict';

  function authController($scope, authService) {
    var vm = this;
    vm.loginModel = {};
    vm.changePasswordModel = {};

    vm.authModel = authService.model;

    vm.loginFormSubmit = function (email, password) {
      if ($scope.loginForm.$valid) {
        authService.login(email, password);
      }
      else {
        $scope.loginForm.submitted = true;
      }
    };

    vm.registerFormSubmit = function (firstName, lastName, email) {
      if ($scope.registerForm.$valid) {
        authService.register(firstName, lastName, email);
      }
      else {
        $scope.registerForm.submitted = true;
      }
    };

    vm.changePasswordFormSubmit = function (oldPassword, newPassword, confirmPassword) {
      if ($scope.changePasswordForm.$valid) {
        authService.changePassword(oldPassword, newPassword, confirmPassword);
      }
      else {
        $scope.changePasswordForm.submitted = true;
      }
    };

  }

  angular
    .module('auth')
    .controller('authController', authController);

  authController.$inject = ['$scope', 'authService'];

})();