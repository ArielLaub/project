var Promise = require('bluebird');
var request = require('superagent');
var qs = require('qs');

var Config = require('../../config');
var util = require('util');
function getMethod(target, method) {
    var query = {
        NetworkId: Config.hasOffersNetworkId,
        NetworkToken: Config.hasOffersApiKey,
        Target: target,
        Method: method,            
    }
    
    return function(params) {
        var q = qs.stringify(Object.assign(params, query));
        return new Promise((resolve, reject) => {
            request
                .get('https://api.hasoffers.com/Apiv3/json')
                .set('Accept', 'application/json')
                .query(q)
                .end(function(error, response) {
                    if (error) {
                        return reject(new Error(error.message));
                    } 
                    resolve(response.body.response);
                });            
         });
    }
}

class Target {
    constructor(target) {
        this.target = target;
    }
    
    _init(methods) {
        methods.forEach(method => {
            this[method] = getMethod(this.target, method);
        });
    }
}

class Affiliate extends Target {
    constructor() {
        super('Affiliate');
        
        this._init([   
            'addAccountNote',
            'adjustAffiliateClicks',
            'block',
            'create',
            'createSignupQuestion',
            'createSignupQuestionAnswer',
            'disableFraudAlert',
            'enableFraudAlert',
            'findAll',
            'findAllByIds',
            'findAllFraudAlerts',
            'findAllIds',
            'findAllIdsByAccountManagerId',
            'findAllPendingUnassignedAffiliateIds',
            'findAllPendingUnassignedAffiliates',
            'findById',
            'findList',
            'getAccountManager',
            'getAccountNotes',
            'getAffiliateTier',
            'getApprovedOfferIds',
            'getBlockedOfferIds',
            'getBlockedReasons',
            'getCreatorUser',
            'getOfferConversionCaps',
            'getOfferHostnames',
            'getOfferPayouts',
            'getOfferPayoutsAll',
            'getOfferPixels',
            'getOwnersAffiliateAccountId',
            'getPaymentMethods',
            'getReferralAffiliateIds',
            'getReferralCommission',
            'getReferringAffiliate',
            'getSignupAnswers',
            'getSignupQuestions',
            'getUnapprovedOfferIds',
            'getUnblockedOfferIds',
            'removeCustomReferralCommission',
            'setCustomReferralCommission',
            'signup',
            'simpleSearch',
            'update',
            'updateAccountNote',
            'updateByRefId',
            'updateField',
            'updatePaymentMethodCheck',
            'updatePaymentMethodDirectDeposit',
            'updatePaymentMethodOther',
            'updatePaymentMethodPayoneer',
            'updatePaymentMethodPaypal',
            'updatePaymentMethodPayQuicker',
            'updatePaymentMethodWire',
            'updateSignupQuestion',
            'updateSignupQuestionAnswer'
        ]);
    }
}

class Report extends Target {
    constructor() {
        super('Report');
        
        this._init([   
            'getActiveCurrencies',
            'getAffiliateCommissions',
            'getConversions',
            'getManagerCommissions',
            'getModSummaryLogs',
            'getReferrals',
            'getStats',
            'getSubscriptions'
        ]);
    }
}

module.exports.report = new Report();
module.exports.affiliate = new Affiliate();
