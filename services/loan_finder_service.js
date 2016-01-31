'use strict' 

var Promise = require('bluebird');
var MessageService = require('../bus/message_service');
var Config = require('../config');
var Errors = require('../errors');

var utils  = require('../utils');
var logger = utils.logger.create('services.loan_matcher_service');
var questions = require('./loan_finder/questions');
var LenderPreference = require('../model/lender_preference');
var Lender = require('../model/lender');

const HOW_MUCH_FUNDING_QUESTION_ID = 1;
const FUNDING_PURPOSE_QUESTION_ID = 3;
const HOW_LONG_IN_BUSINESS_QUESTION_ID = 4;
const BUSINESS_YEARLY_REVENUE_QUESTION_ID = 5;

const REVOLVING_CREDIT_LENDER_ID = 9;
const LIBERIS_LENDER_ID = 10;
const EBURY_LENDER_ID = 11;
const MARKET_INVOICE_LENDER_ID = 12;
const INVOICE_CYCLE_LENDER_ID = 15;
const FUNDING_INVOICE_LENDER_ID = 25;

const MORE_THAN_6_MONTHS_OLD_ANSWER_IDS = [32,33,34,35];
const MORE_THAN_12_MONTHS_OLD_ANSWER_IDS = [33,34,35];
const LESS_THAN_50K_FUNDING_ANSWER_IDS = [3,4,5,6];
const MORE_THAN_10K_REVENUES_ANSWER_IDS = [43,44,45,46,47,48,49,50,51,52,53];
const MORE_THAN_100K_REVENUES_ANSWER_IDS = [52,53];
const PURCHASE_INVENTORY_ANSWER_ID = 25;
const REAL_ESTATE_ANSWER_ID = 26;
const IMPORT_ANSWER_ID = 28;
const PURCHASE_ASSETS_ANSWER_ID = 46;

const ASSET_BASED_FINANCE_TYPE_ID = 5;
const PROPERY_LOAN_TYPE_ID = 6;
const INVOICE_LENDER_TYPE_ID = 8;

class LoadFinderService extends MessageService {
    constructor(connection) {
        super(connection, 'LoanFinder.Service');
    }
    
    getQuestions(request) {
        return Promise.resolve(questions);
    }
    
    getQualifingLenders(request) {
        if (!request.account_id) return new Errors.AccountIdRequired();
        if (!request.answers) return new Errors.AnswersRequired();
        
        var resultByLenderId = new Map(); //holds results by lender id including its score
        var answerByQuestionId = new Map();
        var q2a = answerByQuestionId.get.bind(answerByQuestionId);
        
        return Promise.each(request.answers, answer => {
            answerByQuestionId.set(answer.question_id, answer.answer_id);
            return LenderPreference.getPositiveLenderIds(answer.question_id, answer.answer_id)
                .then(lenderIds => {
                    //for each lender that this answer qualifies for we increase
                    //the score for that lender by one
                    return Promise.each(lenderIds, lenderId => {
                        if (!resultByLenderId.has(lenderId))
                            resultByLenderId.set(lenderId, {lender_id: lenderId, score: 1});
                        else
                            resultByLenderId.get(lenderId).score += 100;                        
                    });    
                });
        }).then(() => {
            return Lender.getAll();          
        }).then(lenders => {
            //extend the results to includ the url, name and description of the lender
            //account_id => aff_sub query param
            //affiliate_id => aff_sub5
            //affiliate_sub_id => aff_sub2
            lenders.forEach(lender => {
                if (resultByLenderId.has(lender.id)) {
                    var result = resultByLenderId.get(lender.id);
                    result.url = lender.url;
                    result.url += ((result.url && result.url.indexOf('?')) !== -1 ? '&' : '?') + 
                        `aff_sub4=${request.account_id}`;
                    result.name = lender.name;
                    result.description = lender.description;
                    if (request.affiliate_id)
                        result.url += `&aff_sub5=${request.affiliate_id}`;
                    if (request.affiliate_sub_id)
                        result.url += `&aff_sub2=${request.affiliate_sub_id}`;

                    //SCORING RULES 
                    //====================
                                            
                    //Invoice Funding Type
                    //and customer has other businesses or revenues over 5m
                    //then remove
                    if (INVOICE_LENDER_TYPE_ID === lender.company_types_id &&
                        (request.customers_other_businesses || request.revenues_over_5m)) {
                        result.score = -100;
                    }
                    
                    // Asset Based Finance Type
                    // get priority if "Loan purpose" is related to "Purchase assets".
                    if (ASSET_BASED_FINANCE_TYPE_ID === lender.company_types_id &&
                        PURCHASE_ASSETS_ANSWER_ID === answerByQuestionId.get(FUNDING_PURPOSE_QUESTION_ID)) {
                        result.score += 6
                    }

                    // Property Loan Type
                    // get priority if "Loan purpose" is related to "Purchase assets".
                    if (PROPERY_LOAN_TYPE_ID === lender.company_types_id &&
                        REAL_ESTATE_ANSWER_ID === answerByQuestionId.get(FUNDING_PURPOSE_QUESTION_ID)) {
                        result.score += 5
                    }
                    
                    // Revolving credit
                    // always get a huge boost???
                    if (REVOLVING_CREDIT_LENDER_ID === lender.id) {
                        result.score += 50;
                    }
                    
                    // Marketinvoice
                    // if invoices + business 6 month + min revenues 100k
                    //TODO: invoices?
                    if (MARKET_INVOICE_LENDER_ID === lender.id &&
                        MORE_THAN_6_MONTHS_OLD_ANSWER_IDS.indexOf(answerByQuestionId.get(HOW_LONG_IN_BUSINESS_QUESTION_ID)) !== -1 &&
                        MORE_THAN_100K_REVENUES_ANSWER_IDS.indexOf(answerByQuestionId.get(BUSINESS_YEARLY_REVENUE_QUESTION_ID)) !== -1) {
                        result.score += 10;
                    }
                    
                    // Funding Invoice 
                    // always gets priority???
                    if (FUNDING_INVOICE_LENDER_ID === lender.id) {
                        result.score += 9;
                    }
                    
                    // Invoice Cycle
                    // (if invoices + business 12 month + min revenues 10k)
                    //TODO: invoices?
                    if (INVOICE_CYCLE_LENDER_ID === lender.id &&
                        MORE_THAN_12_MONTHS_OLD_ANSWER_IDS.indexOf(answerByQuestionId.get(HOW_LONG_IN_BUSINESS_QUESTION_ID)) !== -1 &&
                        MORE_THAN_10K_REVENUES_ANSWER_IDS.indexOf(answerByQuestionId.get(BUSINESS_YEARLY_REVENUE_QUESTION_ID)) !== -1) {
                        result.score += 8;
                    }
                    
                    // Liberis get priority if has card payments and over 4k.
                    if (LIBERIS_LENDER_ID === lender.id &&
                        request.process_card &&
                        request.process_over_4k) {
                        result.score += 7;
                    }
                    
                    // Ebury
                    if (EBURY_LENDER_ID === lender.id) {
                        //if purpose is Purchase Inventory or Import
                        if ([PURCHASE_INVENTORY_ANSWER_ID,IMPORT_ANSWER_ID].indexOf(answerByQuestionId.get(FUNDING_PURPOSE_QUESTION_ID)) !== -1) {
                            result.score += 4;         
                        }
                                   
                        //amount <50k pounds
                        //then remove.
                        if (LESS_THAN_50K_FUNDING_ANSWER_IDS.indexOf(answerByQuestionId.get(HOW_MUCH_FUNDING_QUESTION_ID)) !== -1) { 
                            result.score = -100;                 
                        }
                    }
                }
            });
            
            //flatten results to an array and sort by score (descending)
            var results = [];
            for (var value of resultByLenderId.values()) 
                 results.push(value);
            
            results.sort((a, b) => b.score - a.score);
            
            //remove long tail
            while (results.length > 0 && results[results.length-1].score < 100)
                results.pop();
            
            //only return results we resolved a lender for
            return results.filter(result => !!result.name);               
        });
    }
}

module.exports = LoadFinderService;