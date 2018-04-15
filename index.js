// setup logger
const logger = require('winston');
module.exports = { logger };

if (process.env.DEBUG) {
    logger.level = 'debug';
}


// route command line
require('yargs')
    .commandDir('commands')
    .demandCommand()
    .strict()
    .help()
    .argv;
