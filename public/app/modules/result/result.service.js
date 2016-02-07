(function () {
  'use strict';

  function resultService($http, $q) {

    var _model = {

    };

    var service = {
      model: _model
    };

    return service;
  }

  angular
    .module('result')
    .factory('resultService', resultService);

  resultService.$inject = ['$http', '$q'];

})();