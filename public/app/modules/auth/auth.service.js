(function () {
  'use strict';

  function authService($http, $state, $q, $log, localStorageService) {

    var _model = {
      loggedIn: false,
      loginError: null,
      changePasswordError: null
    };

    var login = function (email, password) {
      var deferred = $q.defer();

      $http.post('/api/accounts/authenticate', {
        email: email,
        password: password
      }).then(function success(data, status, headers, config) {
        _model.loginError = null;
        _model.changePasswordError = null;
        _model.loggedIn = true;
        angular.extend(_model, data.data.result);
        deferred.resolve(data.data.result);
        $state.go('root.loan-options');
      }, function error(data, status, headers, config) {
       if (data.status === 401) {
          _model.loginError = data.data.error;
       }

        _model.loggedIn = false;
        deferred.reject(data);
      })

      return deferred.promise;
    };

    var changePassword = function (oldPassword, newPassword, confirmPassword) {
      var deferred = $q.defer();

      $http.post('/api/accounts/changePassword', {
        old_password: oldPassword,
        new_password: newPassword,
        confirmPassword: confirmPassword
      }).then(function success(data, status, headers, config) {
        _model.changePasswordError = null;
        angular.extend(_model, data.data.result);
        deferred.resolve(data.data.result);
        $state.go('root.loan-options');
      }, function error(data, status, headers, config) {
        if (data.data.error) {
          _model.changePasswordError = data.data.error;
        }
        else {
          _model.changePasswordError = 'unknown';
        }
      })

      return deferred.promise;
    };

    var logout = function () {

      _model.loggedIn = false;

      // delete the token from local storage
      var cookieTokenName = 'JWToken';
      localStorageService.remove(cookieTokenName);

      var deferred = $q.defer();

      $http.post('/api/accounts/logout')
        .success(function (data, status, headers, config) {
          deferred.resolve(data.data.result);
          
          angular.extend(_model, data.data.result);
            $state.go('root.login');
        })
        .error(function (data, status, headers, config) {
          deferred.reject(data.data.error);
        });

      return deferred.promise;
    };

    var refresh = function () {
      var deferred = $q.defer();

      $http.post('/api/accounts/refreshToken')
        .success(function (data, status, headers, config) {
          _model.loggedIn = true;
          //angular.extend(_model, data.data.result ? data);
          deferred.resolve();
        })
        .error(function (data, status, headers, config) {
          deferred.reject(data.data.error);
        });

      return deferred.promise;
    };

    var register = function (firstName, lastName, email) {
      var deferred = $q.defer();

      $http.post('/api/accounts/create', {
        email: email,
        password: '123456',
        first_name: firstName,
        last_name: lastName,
        referrer_id: localStorageService.get('referrerId'),
        affiliate_id: localStorageService.get('affiliateId')
      })
        .success(function (data, status, headers, config) {
          _model.loggedIn = true;
          angular.extend(_model, data.data.result);
          deferred.resolve(data.data.result);
          $state.go('root.loan-options');
        })
        .error(function (data, status, headers, config) {
          $log.debug(data.data.error);
          deferred.reject(data.data.error);
        });

      return deferred.promise;
    };

    var service = {
      login: login,
      logout: logout,
      refresh: refresh,
      register: register,
      changePassword: changePassword,
      model: _model
    };

    return service;
  }

  angular
    .module('auth')
    .factory('authService', authService);

  authService.$inject = ['$http', '$state', '$q', '$log', 'localStorageService'];

})();