'use strict'

module.exports = {
    SPEC_FILE_PATH: 'rabbitmq/full/amqp0-9-1.stripped.extended',
    //exchanges
    BUS_EXCHANGE_NAME: 'fundbird.bus',
    BUS_EXCHANGE_TYPE: 'topic', //do not change
    CALLBACKS_EXCHANGE_NAME: 'fundbird.bus.callback',
    CALLBACKS_EXCHANGE_TYPE: 'direct', //do not change
    RETRY_EXCHANGE_NAME: 'fundbird.bus.retry',
    RETRY_EXCHANGE_TYPE: 'topic', //do not change
    
    MESSAGE_PROCESSING_TIME_LIMIT: 600000, //10 minutes
}