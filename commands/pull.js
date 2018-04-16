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
    const prompts = [];

    // prompt interactively for username and/or password if not provided
    if (!argv.key && !argv.token) {
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
        logger.debug('executing pull command', argv);
        await pull(argv);
    } catch (err) {
        console.error('Failed to pull:', err);
        process.exit(1);
    }
};



async function pull(options) {
    const hostOptions = {
        baseURL: `http://${options.host}`,
        validateStatus: status => status == 200 || status == 300
    };


    // configure host authentication
    if (options.token) {
        hostOptions.headers = {
            Authorization: 'Token '+options.token
        };
    } else if (options.key) {
        hostOptions.params = {
            accessKey: options.key
        };
    } else if (options.username && options.password) {
        hostOptions.params = {
            '_LOGIN[username]': options.username,
            '_LOGIN[password]': options.password
        };
    } else {
        throw 'Key, token, or username+password must be provided to authenticate with host'
    }


    // configure axios instance
    const axios = require('axios').create(hostOptions);
    logger.debug('axios options', hostOptions);


    // fetch file tree
    const treeResponse = await axios.get('/emergence');
    logger.debug('tree response:', JSON.stringify(treeResponse.data, null, 4));


    const git = await require('git-client').requireVersion('>=2.7.4');

    //let status = await git.status({ help: true });

    //logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    // logger.debug('getGitDirFromEnvironment:', await git.Git.getGitDirFromEnvironment());
    // logger.debug('getWorkTreeFromEnvironment:', await git.Git.getWorkTreeFromEnvironment());
};
