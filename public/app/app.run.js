(function () {
  'use strict';

  function appRun($rootScope, $log) {

    $rootScope.$log = $log;

  }

  angular
    .module('app')
    .run(appRun);

  appRun.$inject = ['$rootScope', '$log'];

})();