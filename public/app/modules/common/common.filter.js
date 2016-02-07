(function () {
  'use strict';

  function spacelessFilter() {
    return function (input) {
      return input.replace(/\s+/g, '-');
    }
  }

  function parseUrl($sce) {
    return function (input) {
      return $sce.trustAsHtml(input);
    }
  }

  angular
    .module('common')
    .filter('spaceless', spacelessFilter)
    .filter('parseUrl', parseUrl);
})();