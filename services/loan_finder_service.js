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
var LoanProcess = require('../model/loan_process');
var LenderType = require('../model/lender_type');
var Account = require('../model/account'); //temp until we move companies out of accounts;

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
    
    getProcessesByStatusFrom(request) {
        return LoanProcess.getProcessesByStatusFrom(
            request.status,
            utils.ticksToDate(request.from),
            999, 0 //page size and index
        );
    }
    
    getAccountLastApplication(request) {
        return new Promise((resolve, reject) => {
            if (!request.account_id) 
                return reject(new Errors.AccountIdRequired());
            resolve(request.account_id);                        
        }).then(accountId => {
            return LoanProcess.getLastByAccountId(accountId);
        }).then(process => {
            if (!process) return {};
            Object.keys(process.form_fields.answer).forEach(question => {
                //legacy: answers were stored as map<string, string> 
                process.form_fields.answer[question] = String(process.form_fields.answer[question]);
            });
            return {
                form_fields: process.form_fields,
                //results: process.results
                //status: process ? process.status : -1
            }
        });
    }
    
    setAccountCompanyInfo(request) {
        return new Promise((resolve, reject) => {
            if (!request.account_id) 
                return reject(new Errors.AccountIdRequired());
            resolve(request.account_id);                        
        }).then(accountId => {
            return Account.setCompany(accountId, {
                company: request.company_name ? request.company_name : undefined,
                company_number: request.company_number ? request.company_number : undefined,
                postal_code: request.postal_code ? request.postal_code : undefined,
                phone: request.phone ? request.phone : undefined
            }).then(account => {
                return {
                    account_id: account.id,
                    company_name: account.company,
                    company_number: account.company_number,
                    phone: account.phone,
                    postal_code: account.postal_code
                }
            });
        });
    }
    
    getQualifingLenders(request) {
        //layer one questions:
        //1. how long have you been in business.
        //2. revenues.
        //3. industry.
        //4. business type.
        
        var resultByLenderId = new Map(); //holds results by lender id including its score
        var results = [];
        var answers;
        var formFields;
        
        function _scoreResult(result, lender) {
            //SCORING RULES 
            //====================
                                    
            //Invoice Funding Type
            //and customer has other businesses or revenues over 5m
            //then remove
            if (INVOICE_LENDER_TYPE_ID === lender.company_types_id &&
                (!formFields.customers_other_businesses || formFields.revenues_over_5m)) {
                result.score = -100;
            }
            
            // Asset Based Finance Type
            // get priority if "Loan purpose" is related to "Purchase assets".
            if (ASSET_BASED_FINANCE_TYPE_ID === lender.company_types_id &&
                PURCHASE_ASSETS_ANSWER_ID === answers[FUNDING_PURPOSE_QUESTION_ID]) {
                result.score += 6
            }

            // Property Loan Type
            // get priority if "Loan purpose" is related to "Purchase assets".
            if (PROPERY_LOAN_TYPE_ID === lender.company_types_id &&
                REAL_ESTATE_ANSWER_ID === answers[FUNDING_PURPOSE_QUESTION_ID]) {
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
                MORE_THAN_6_MONTHS_OLD_ANSWER_IDS.indexOf(answers[HOW_LONG_IN_BUSINESS_QUESTION_ID]) !== -1 &&
                MORE_THAN_100K_REVENUES_ANSWER_IDS.indexOf(answers[BUSINESS_YEARLY_REVENUE_QUESTION_ID]) !== -1) {
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
                MORE_THAN_12_MONTHS_OLD_ANSWER_IDS.indexOf(answers[HOW_LONG_IN_BUSINESS_QUESTION_ID]) !== -1 &&
                MORE_THAN_10K_REVENUES_ANSWER_IDS.indexOf(answers[BUSINESS_YEARLY_REVENUE_QUESTION_ID]) !== -1) {
                result.score += 8;
            }
            
            // Liberis get priority if has card payments and over 4k.
            if (LIBERIS_LENDER_ID === lender.id &&
                formFields.process_card &&
                formFields.process_over_2500) {
                result.score += 7;
            }
            
            // Ebury
            if (EBURY_LENDER_ID === lender.id) {
                //if purpose is Purchase Inventory or Import
                if ([PURCHASE_INVENTORY_ANSWER_ID,IMPORT_ANSWER_ID].indexOf(answers[FUNDING_PURPOSE_QUESTION_ID]) !== -1) {
                    result.score += 4;         
                }
                        
                //amount <50k pounds
                //then remove.
                if (LESS_THAN_50K_FUNDING_ANSWER_IDS.indexOf(answers[HOW_MUCH_FUNDING_QUESTION_ID]) !== -1) { 
                    result.score = -100;                 
                }
            }
        }
        
        function _buildUrl(lender) {
            let url = lender.url;
            url += ((url && url.indexOf('?')) !== -1 ? '&' : '?') + 
                `aff_sub4=${request.account_id}`;
            if (request.affiliate_id)
                url += `&aff_sub5=${request.affiliate_id}`;
            if (request.affiliate_sub_id)
                url += `&aff_sub2=${request.affiliate_sub_id}`;
            
            return url;
        }
        
        return new Promise(resolve => {
            if (!request.account_id) throw new Errors.AccountIdRequired();
            if (!request.form_fields || !request.form_fields.answer) throw new Errors.AnswersRequired();
            formFields = request.form_fields;
            answers = request.form_fields.answer;
            resolve();            
        }).then(() => {
            return Promise.each(Object.keys(answers), questionId => {
                return LenderPreference.getPositiveLenderIds(questionId, answers[questionId])
                    .then(lenderIds => {
                        //for each lender that this answer qualifies for we increase
                        //the score for that lender by one
                        return Promise.each(lenderIds, lenderId => {
                            if (!resultByLenderId.has(lenderId))
                                resultByLenderId.set(lenderId, {company_id: lenderId, score: 100});
                            else
                                resultByLenderId.get(lenderId).score += 100;                        
                        });    
                    });
            });          
        }).then(() => {
            return Lender.getAll();          
        }).then(lenders => {
            //extend the results to includ the url, name and description of the lender
            //account_id => aff_sub query param
            //affiliate_id => aff_sub5
            //affiliate_sub_id => aff_sub2
            results = [];
            for (var value of resultByLenderId.values()) 
                 results.push(value);

            return Promise.each(lenders, lender => {
                if (resultByLenderId.has(lender.id)) {
                   return LenderType.getLenderTypeById(lender.company_types_id)
                        .then(type => {
                            let result = resultByLenderId.get(lender.id);
                            _scoreResult(result, lender);

                            Object.assign(result, {
                                url: _buildUrl(lender), 
                                name: lender.name,
                                company_description: lender.description,
                                company_requirements: lender.requirements,
                                company_types_id: lender.company_types_id,
                                funds_received: lender.funds_received,
                                cost_rate: lender.cost_rate,
                                cost_period: lender.cost_period,
                                trustpilot_rate: utils.parseFloat(lender.trustpilot_rate),
                                trustpilot_rates: utils.parseInt(lender.trustpilot_rates),
                                trustpilot_stars: utils.parseInt(lender.trustpilot_stars),
                                amount: lender.amount,
                                terms: lender.terms,
                                description: lender.description,
                                logo: lender.logo,
                                loan_type: type.name,
                                loan_type_description: type.description,
                                loan_type_benefits: type.benefits,
                                loan_type_drawbacks: type.drawbacks
                            });            
                        }).catch(() => {
                            resultByLenderId.delete(lender.id);
                        });                        
                } else {
                    return Promise.resolve();
                }
            }).then(() => {
                //only return results we resolved a lender for
                results = results.filter(result => !!result.name);               
                results.sort((a, b) => b.score - a.score);

                //remove long tail
                while (results.length > 0 && results[results.length-1].score < 700)
                    results.pop();
                
            });

        }).then(() => {
            return LoanProcess.create(request.account_id, answers, formFields, results, request.ip);
        }).then(process => {
            results.forEach(result => {
                result.url += `&aff_sub3=${process.process_id}`;
            });

            return {matches: results};
        });
    }
}

module.exports = LoadFinderService;