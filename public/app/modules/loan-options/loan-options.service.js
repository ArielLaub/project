(function () {
  'use strict';

  function loanOptionsService($http, $q, $state) {

    var _model = {};

    // TODO: Move to database or general config file
    var _fieldOptions = {
      businessState: [
        {value: '30', name: 'Not in business yet / 1-3 months'},
        {value: '31', name: '4-5 month'},
        {value: '32', name: '6-12 month'},
        {value: '33', name: '1-2 years'},
        {value: '34', name: '2-3 years'},
        {value: '35', name: 'Over 3 years'}
      ],
      loanPurpose: [
        {value: '20', name: 'Start New Business'},
        {value: '21', name: 'Improve Cash Flow'},
        {value: '22', name: 'Immediate Needs'},
        {value: '23', name: 'Working Capital'},
        {value: '24', name: 'Expansion & Growth'},
        {value: '25', name: 'Purchase Inventory'},
        {value: '26', name: 'Real Estate'},
        {value: '27', name: 'Refinancing Debts'},
        {value: '28', name: 'Import'},
        {value: '29', name: 'Export'},
        {value: '46', name: 'Purchase assets'},
        {value: '71', name: 'Purchase Business'}
      ],
      industry: [
        {value: '44', name: 'Retail'},
        {value: '45', name: 'Business Services'},
        {value: '47', name: 'Leisure & Hopitality'},
        {value: '54', name: 'Manufacturing'},
        {value: '55', name: 'Wholesale'},
        {value: '56', name: 'Real Estate'},
        {value: '57', name: 'Ecommerce'},
        {value: '58', name: 'Healthcare'},
        {value: '59', name: 'Other'}
      ],
      annualRevenue: [
        {value: '36', name: 'No revenue yet'},
        {value: '39', name: 'under £10,000'},
        {value: '43', name: '£10,000 - £12,000'},
        {value: '48', name: '£12,000 - £30,000'},
        {value: '49', name: '£30,000 - £36,000'},
        {value: '50', name: '£36,000- £50,000'},
        {value: '51', name: '£50,001 - £100,000'},
        {value: '52', name: '£100,000 - £1,000,000'},
        {value: '53', name: '£1,000,000 +'}
      ],
      businessType: [
        {value: '37', name: 'Sole trader'},
        {value: '40', name: 'Partnership'},
        {value: '38', name: 'LLP'},
        {value: '41', name: 'Limited company'}
      ],


      loanTerm: [
        {value: '13', name: 'Ongoing', exclude: true, button: true},
        {value: '14', name: 'Flexible', exclude: true, button: true},
        {value: '15', name: '1 - 5 months', exclude: false},
        {value: '16', name: '6 - 12 months', exclude: false},
        {value: '17', name: '1 - 2 years', exclude: false},
        {value: '18', name: '2 - 3 years', exclude: false},
        {value: '19', name: 'Over 3 years', exclude: false}
      ],

      // See controller for original values of the radio buttons
      businessBank: [
        {name: 'Do you have a business bank account?', title: true},
        {value: '1', name: 'Yes'},
        {value: '0', name: 'No'}
      ],

      businessCredit: [
        {name: 'Do you have a business credit card?', title: true},
        {value: '1', name: 'Yes'},
        {value: '0', name: 'No'}
      ],
      creditCards: [
        {name: 'Do you process any debit/ credit cards?', title: true},
        {value: '1', name: 'Yes'},
        {value: '0', name: 'No'}
      ],
      over4K: [
        {name: 'Do you process over 4,000/ month?', title: true},
        {value: '1', name: 'Yes'},
        {value: '0', name: 'No'}
      ],
      otherBusinesses: [
        {name: 'Are your customers other businesses?', title: true},
        {value: '1', originalValue: '60', name: 'Yes'},
        {value: '0', originalValue: '61', name: 'No'}
      ],
      over5M: [
        {name: 'Are these customers in the public sector or have annual revenues over 5M?', title: true},
        {value: '1', name: 'Yes'},
        {value: '0', name: 'No'}
      ],
      guarantee: [
        {name: 'Will the business owners provide a personal guarantee?', title: true},
        {value: '1', originalValue: '72', name: 'Yes'},
        {value: '0', originalValue: '73', name: 'No'}
      ]

    }

    var validateCompanyNumber = function(companyNumber, companyName, businessState) {
        var data = {
            company_number: companyNumber,
            company_name: companyName,
            //businessState: businessState
        };

        var deferred = $q.defer();
        $http.post('/api/identity/verifyCompany', data)
            .then(function success(data, status, headers, config) {
                if (data.result.valid)
                    deferred.resolve();
                else
                    deferred.reject({error: data.result.error, field: data.result.field});
            },
            function error(data, status, headers, config) {
                deferred.reject({error: 'could not validate company number', field: 'number'})
            });
            
         return deferred.promise;     
    };

    var saveLoanOptions = function (post) {
        var deferred = $q.defer();
        $http.post('/api/loans/find', post)
            .then(function success(data, status, headers, config) {
                angular.extend(_model, data.result.matches);
                deferred.resolve(data);
                $state.go('root.result');
            }, function error(data, status, headers, config) {
                deferred.reject(data);
                $state.go('root.login');
            });

        return deferred.promise;
    };

    return {
      fieldOptions: _fieldOptions,
      saveLoanOptions: saveLoanOptions,
      validateCompanyNumber: validateCompanyNumber,
      model: _model
    };
  }

  angular
    .module('loanOptions')
    .factory('loanOptionsService', loanOptionsService);

  loanOptionsService.$inject = ['$http', '$q', '$state'];

})();
