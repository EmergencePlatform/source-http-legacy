exports.command = 'pull <hostname>';
exports.desc = 'Pull filesystem state from hostname';
exports.builder = {
    username: {
        describe: 'Developer username to authenticate with'
    },
    password: {
        describe: 'Developer password to authenticate with'
    },
    key: {
        describe: 'Emergence inheritance key to authenticate with instead of developer user'
    }
};

exports.handler = async argv => {
    const prompts = [];

    // prompt interactively for username and/or password if not provided
    if (!argv.key) {
        if (!argv.username) {
            prompts.push({
                name: 'username',
                message: 'Developer username'
            });
        }

        if (!argv.password) {
            prompts.push({
                name: 'password',
                message: 'Developer password',
                type: 'password'
            });
        }

        if (prompts.length) {
            Object.assign(argv, await require('inquirer').prompt(prompts));
        }
    }


    // execute command
    try {
        await pull(argv);
    } catch (err) {
        console.error('Failed to pull:', err);
        process.exit(1);
    }
};



async function pull({ key, username, password }) {
    const logger = require('../lib/logger.js');
    const git = await require('git-client').requireVersion('>=2.7.4');

    if (!key && (!username || !password)) {
        throw 'Key or username+password must be provided to authenticate with host'
    }

    logger.debug('argv', arguments[0]);

    //let status = await git.status({ help: true });

    //logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    // logger.debug('getGitDirFromEnvironment:', await git.Git.getGitDirFromEnvironment());
    // logger.debug('getWorkTreeFromEnvironment:', await git.Git.getWorkTreeFromEnvironment());
};
