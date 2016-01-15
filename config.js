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