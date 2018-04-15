// setup logger
const logger = require('winston');
module.exports = { logger };

if (process.env.DEBUG) {
    logger.level = 'debug';
}


// setup habitat
const git = require('./lib/git.js');
const gitRequired = '>=2.7.4';


// start up in async context
start().catch(err => logger.error('Failed to start tool:', err.message));


async function start () {
    // check git version
    if (!await git.satisfiesVersion(gitRequired)) {
        throw new Error(`Git version must be ${gitRequired}, reported version is ${await git.getVersion()}`);
    }

    let status = await git.status({ help: true });

    logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    debugger;
}