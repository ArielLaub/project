'use strict'

var Promise = require('bluebird');
var ServiceProxy = require('../bus/service_proxy');
var Connection = require('../bus/amqp/connection');
var LoanProcess = require('../model/loan_process');
var utils  = require('../utils');
var logger = utils.logger.create('scheduled_tasks.email_reminders');

function execute() {
    logger.info('starting emails reminder scheduled task');
    var connection = new Connection();
    var notifications = new ServiceProxy(connection, 'Notifications.Service');
    
    return connection.connectUrl().then(() => {
        return notifications.init()
    }).then(() => {
        return LoanProcess.getProcessesByStatus({
            status: LoanProcess.STATUS_NEW
        });
    }).then(processes => {
        return Promise.each(processes, process => {
            return notifications.send24HoursReminderEmail({
                account_id: process.user_id,
                lender_id: process.results[0]
            }).then(() => {
                return LoanProcess.setStatusSafe(process.id, LoanProcess.STATUS_NEW, LoanProcess.STATUS_REMINDED);
            })
        });
    }).then(() => {
        logger.info('finishing processing email reminders');
    });
}

if (require.main === module) {
    execute();
} else {
    module.exports.execute = execute;    
}
