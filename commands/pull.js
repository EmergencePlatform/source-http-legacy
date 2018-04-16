const logger = require('../lib/logger.js');

exports.command = 'pull <host>';
exports.desc = 'Pull filesystem state from emergence host';
exports.builder = {
    username: {
        describe: 'Developer username to authenticate with'
    },
    password: {
        describe: 'Developer password to authenticate with'
    },
    key: {
        describe: 'Emergence inheritance key to authenticate with instead of developer user'
    },
    token: {
        describe: 'Developer session token instead of username+password'
    }
};

exports.handler = async argv => {
    // execute command
    try {
        logger.debug('executing pull command', argv);
        await pull(argv);
    } catch (err) {
        console.error('Failed to pull:', err);
        process.exit(1);
    }
};



async function pull(options) {
    const hostApi = await require('../lib/host.js').getApi(options);

    logger.debug('got host api:', hostApi);


    // fetch file tree
    const treeResponse = await hostApi.get('/emergence/site-root/lib');
    logger.debug('tree response:', JSON.stringify(treeResponse.data, null, 4));


    const git = await require('git-client').requireVersion('>=2.7.4');

    //let status = await git.status({ help: true });

    //logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    // logger.debug('getGitDirFromEnvironment:', await git.Git.getGitDirFromEnvironment());
    // logger.debug('getWorkTreeFromEnvironment:', await git.Git.getWorkTreeFromEnvironment());
};
