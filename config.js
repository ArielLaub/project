'use strict'

class Config {
    static get isProduction() {
        return (process.env.NODE_ENV === 'production');
    }
    
    static get isDevelopment() {
        return (process.env.NODE_ENV === 'development');
    }
    
    static get isLocal() {
        return (!process.env.NODE_ENV || ['production', 'development'].indexOf(process.env.NODE_ENV) === -1)
    }
    
    static get mySqlConnectionString() {
        return 'mysql://root:@localhost/auto_test?debug=true&charset=UTF8&timezone=+0200' 
    }
    
    static get amqpConnectionString() {
        return 'amqp://guest:guest@localhost:5672/';
    }
    
    static get jwtPrivateKey() {
        if (!this._jwtPrivateKey)
            this._jwtPrivateKey = require('fs').readFileSync('./private.pem');  
        
        return this._jwtPrivateKey;       
    }
    
    static get jwtPublicKey() {
        if (!this._jwtPublicKey)
            this._jwtPublicKey = require('fs').readFileSync('./public.pem');
        
        return this._jwtPublicKey;
    }
    
    static get mandrillFromEmail() {
        return 'test_user@fundbird.co.uk';
    }
    
    static get mandrillFromName() {
        return 'Test User';
    }
    
    static get mandrillReplyToEmail() {
        return 'reply_to@fundbird.co.uk';
    }
    
    static get mandrillApiKey() {
        return 'g2Y__0WVFA34b1S92sgBMw';
    }
    
    static get hasOffersNetworkId() {
        return 'finimpact';
    }
    
    static get hasOffersApiKey() {
        return 'NETwViJIrY3nnR2t1a5lsnGIwLE5i2';
    }
    
    static get companiesHouseApiKey() {
        return 'KuXr064_IWl66UGg0j_FBIxhBNm54-USSLRfdTXp';
    }
}

class Development extends Config {
    static get mySqlConnectionString() {
        return process.env.CLEARDB_DATABASE_URL;
    }
    
    static get amqpConnectionString() {
        return process.env.CLOUDAMQP_URL;
    }
}

class Production extends Config {
    static get mySqlConnectionString() {
        //mysql://root:dbfun%40res1@52.6.225.136/fundbird?reconnect=true
        return process.env.CLEARDB_DATABASE_URL;
    }
    
    static get amqpConnectionString() {
        return process.env.CLOUDAMQP_URL;
    }    
}

if (Config.isProduction)
    module.exports = Production;
else if (Config.isDevelopment)
    module.exports = Development;
else
    module.exports = Config;