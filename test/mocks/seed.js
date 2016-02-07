var Promise = require('bluebird');
var bookshelf = require('../../model/bookshelf');
var Account = require('../../model/account');
var LoanProcess = require('../../model/loan_process');
var Lender = require('../../model/lender');
var LenderPreference = require('../../model/lender_preference');
var LenderType = require('../../model/lender_type');
var utils = require('../../utils');
var logger = utils.logger.create('tests.seed');

function resetLoanProcesses() {
    logger.info('resetting loan processes');
    return bookshelf.knex.schema.dropTableIfExists(LoanProcess.tableName)
        .then(() => {
            return bookshelf.knex.schema.createTable(LoanProcess.tableName, function (table) {
                table.increments();
                table.timestamps();
                table.integer('process_id');
                table.integer('user_id');
                table.text('form_fields');
                table.text('results');
                table.text('has_offers_data');
                table.string('ip', 60);
                table.string('country_by_ip', 100);
                table.integer('status');
            });                
        }).tap(() => {
            logger.info('resetting loan processes complete');    
        });
}

function resetAccounts() {
    logger.info('resetting accounts');
    return bookshelf.knex.schema.dropTableIfExists(Account.tableName)
        .then(() => {
            return bookshelf.knex.schema.createTable(Account.tableName, function (table) {
                table.increments();
                table.timestamps();
                table.string('email', 100).unique().index().notNullable();
                table.string('first_name', 60);
                table.string('last_name', 60);
                table.string('password', 100).notNullable();
                table.boolean('email_verified').defaultTo(false).notNullable();
                table.string('email_verification_token', 100);
                table.string('reset_password_token', 100);
                table.string('company_number', 20);
                table.string('company', 60);
                table.string('postal_code', 20);
                table.string('phone', 20);
                table.integer('reffid');
                table.integer('affid');
                table.timestamp('reset_password_expires_at');
            });                
        }).tap(() => {
            logger.info('resetting accounts complete');    
        });
}

function resetLenders() {
    logger.info('resetting lenders');
    return bookshelf.knex.schema.dropTableIfExists(Lender.tableName)
        .then(() => {
            return bookshelf.knex.schema.createTable(Lender.tableName, function (table) {
                table.increments();
                table.timestamps();
                table.string('name', 255).unique().index().notNullable();
                table.integer('company_types_id');
                table.integer('weight', 60);
                table.text('description');
                table.string('title', 255);
                table.string('logo', 255);
                table.string('url', 255);
                table.boolean('active').defaultTo(true);
                table.string('cost_rate', 255);
                table.string('cost_period', 255);
                table.string('funds_received', 255);
                table.text('requirements');
                table.text('profile');
                table.string('trustpilot_rate', 255);
                table.string('trustpilot_rates', 255);
                table.string('trustpilot_stars', 255);
                table.string('trustpilot_name', 255);
                table.text('trustpilot_quote');
                table.string('amount', 255);
                table.string('terms', 255);
                table.string('application_process', 255);
            });                
        }).tap(() => {
            logger.info('resetting lenders complete');    
        });
}

function resetLenderTypes() {
    logger.info('resetting lender types');
    return bookshelf.knex.schema.dropTableIfExists(LenderType.tableName)
        .then(() => {
            return bookshelf.knex.schema.createTable(LenderType.tableName, function (table) {
                table.increments();
                table.string('name', 255).unique().index().notNullable();
                table.text('description');
                table.text('benefits');
                table.text('drawbacks');
            });                
        }).tap(() => {
            logger.info('resetting lender types complete');    
        });
}

function resetLenderPreferences() {
    logger.info('resetting lender preferences');
    return bookshelf.knex.schema.dropTableIfExists(LenderPreference.tableName)
        .then(() => {
            return bookshelf.knex.schema.createTable(LenderPreference.tableName, function (table) {
                table.increments();
                table.timestamps();
                table.integer('company_fk').notNullable();
                table.integer('question_fk').notNullable();
                table.integer('answer_fk').notNullable();
                table.integer('status');
                table.integer('active');
            });                
        }).tap(() => {
            logger.info('resetting lender preferences complete');    
        });
}

function seedLenderTypes() {
    logger.info('seeding lender types');
    var lenderTypesData = require('./lender_types_data');
    return Promise.each(lenderTypesData, lenderTypeData => {
        var lenderType = new LenderType();
        return lenderType.save(lenderTypeData);
    }).tap(() => {
        logger.info('seeding lender types complete');
    });    
}

function seedLenders() {
    logger.info('seeding lenders');
    var lendersData = require('./lenders_data');
    return Promise.each(lendersData, lenderData => {
        var lender = new Lender();
        lenderData.created_at = new Date();
        lenderData.updated_at = new Date();
        return lender.save(lenderData);
    }).tap(() => {
        logger.info('seeding lender complete');
    });
}

function seedLenderPreferences() {
    logger.info('seeding lender preferences');
    var prefsData = require('./lender_preferences_data');
    return Promise.each(prefsData, prefData => {
        var preference = new LenderPreference();
        prefData.created_at = new Date();
        prefData.updated_at = new Date();
        return preference.save(prefData);
    }).tap(() => {
        logger.info('seeding lender preferences complete');
    });    
}

function full() {
    logger.info('starting full db seed');
    return resetAccounts()
        .then(() => { return resetLoanProcesses(); })
        .then(() => { return resetAccounts(); })
        .then(() => { return resetLenders(); })
        .then(() => { return resetLenderTypes(); })
        .then(() => { return resetLenderPreferences(); })
        .then(() => { return seedLenders(); })
        .then(() => { return seedLenderTypes(); })
        .then(() => { return seedLenderPreferences(); })
        .tap(() => { logger.info('full db seed complete')});
}


if (require.main === module) {
    full().then(() => {
        process.exit(0);
    });
} else {
    module.exports.resetAccounts = resetAccounts;
    module.exports.resetLoanProcesses = resetLoanProcesses;
    module.exports.resetLenders = resetLenders;
    module.exports.resetLenderTypes = resetLenderTypes;
    module.exports.resetLenderPreferences = resetLenderPreferences;
    module.exports.seedLenders = seedLenders;
    module.exports.seedLenderTypes = seedLenderTypes;
    module.exports.seedLenderPreferences = seedLenderPreferences;
    module.exports.full = full;
}