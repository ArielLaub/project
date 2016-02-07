(function () {
  'use strict';

  function runBlock(authService) {
    authService.refresh();
  }

  angular
    .module('core')
    .run(runBlock);

  runBlock.$inject = ['authService'];

})();
