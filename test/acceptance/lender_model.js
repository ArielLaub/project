'use strict'

var Promise = require('bluebird');

var chai = require('chai');
var expect = chai.expect;

var bookshelf = require('../../model/bookshelf');
var Lender = require('../../model/lender');
var LenderType = require('../../model/lender_type');
var LenderPreference = require('../../model/lender_preference');

var Errors = require('../../errors');

describe('Lender Models', () => {
    before(done => {
        bookshelf.knex.schema.dropTableIfExists('company').then(() => {
            return bookshelf.knex.schema.createTable('company', function (table) {
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
         }).then(() => {
            return bookshelf.knex.schema.dropTableIfExists('company_types');
         }).then(() => {
             return bookshelf.knex.schema.createTable('company_types', function (table) {
                table.increments();
                table.string('name', 255).unique().index().notNullable();
                table.text('description');
                table.text('benefits');
                table.text('drawbacks');
             });
         }).then(() => {
            return bookshelf.knex.schema.dropTableIfExists('info_company_question');
         }).then(() => {
             return bookshelf.knex.schema.createTable('info_company_question', function (table) {
                table.increments();
                table.timestamps();
                table.integer('company_fk').notNullable();
                table.integer('question_fk').notNullable();
                table.integer('answer_fk').notNullable();
                table.integer('status');
                table.integer('active');
             });
        }).then(() => { 
            var lendersData = require('../mocks/lenders_data');
            return Promise.each(lendersData, lenderData => {
                var lender = new Lender();
                lenderData.created_at = new Date();
                lenderData.updated_at = new Date();
                return lender.save(lenderData);
            });
        }).then(() => { 
            var prefsData = require('../mocks/lender_preferences_data');
            return Promise.each(prefsData, prefData => {
                var preference = new LenderPreference();
                prefData.created_at = new Date();
                prefData.updated_at = new Date();
                return preference.save(prefData);
            });
         }).then(() => {
            var lenderTypesData = require('../mocks/lender_types_data');
            return Promise.each(lenderTypesData, lenderTypeData => {
                var lenderType = new LenderType();
                return lenderType.save(lenderTypeData);
            });
         }).then(() => {             
             done();
         }).catch(done);
    });
    
    it('should pass', function(done) {
        done();
    });
});