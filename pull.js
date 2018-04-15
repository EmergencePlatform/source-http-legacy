// setup logger
const logger = require('winston');
module.exports = { logger };

if (process.env.DEBUG) {
    logger.level = 'debug';
}


// pull up in async context
pull().catch(err => logger.error('Failed to start tool:', err.message));

async function pull () {
    const git = await require('git-client').requireVersion('>=2.7.4');

    //let status = await git.status({ help: true });

    //logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    logger.debug('getGitDirFromEnvironment:', await git.Git.getGitDirFromEnvironment());
    logger.debug('getWorkTreeFromEnvironment:', await git.Git.getWorkTreeFromEnvironment());

}