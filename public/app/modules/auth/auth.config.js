(function () {
  'use strict';

  function configBlock($stateProvider) {

    $stateProvider

      .state('root.login', {
        url: '/login',
        resolve: { authService: 'authService' },
        onEnter: function ($timeout, $state, authService) {
          if (authService.model.loggedIn) {
            $timeout(function () {
              $state.go('root.home');
            });
          }
        },
        views: {
          'content@root': {
            templateUrl: 'app/modules/auth/templates/login.html',
            controller: 'authController',
            controllerAs: 'vm'
          }
        }
      })

      .state('root.register', {
        url: '/register',
        resolve: { authService: 'authService' },
        onEnter: function ($timeout, $state, authService) {
          if (authService.model.loggedIn) {
            $timeout(function () {
              $state.go('root.home');
            });
          }
        },
        views: {
          'content@root': {
            templateUrl: 'app/modules/auth/templates/register.html',
            controller: 'authController',
            controllerAs: 'vm'
          }
        }
      })

      .state('root.change-password', {
        url: '/change-password',
        views: {
          'content@root': {
            templateUrl: 'app/modules/auth/templates/change-password.html',
            controller: 'authController',
            controllerAs: 'vm'
          }
        }
      })

      .state('root.logout', {
        url: '/logout',
        resolve: { authService: 'authService' },
        onEnter: function (authService, $state) {
          authService.logout().then(function () {
            $state.go('root.login');
          });
        }
      })
  }

  angular
    .module('auth')
    .config(configBlock);

  configBlock.$inject = ['$stateProvider'];

})();