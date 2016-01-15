
var logger = require('../utils/logger').create('auto_tester');

function BunyanReporter(runner) {
  var passes = 0;
  var failures = 0;

  runner.on('pass', function(test){
    passes++;
    logger.info('pass: %s', test.fullTitle());
  });

  runner.on('fail', function(test, err){
    failures++;
    logger.error('fail: %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', function(){
    logger[failures ? (passes ? 'error' : 'fatal') : 'info']('end: %d/%d', passes, passes + failures);
    process.exit(failures);
  });
}


module.exports = BunyanReporter;
