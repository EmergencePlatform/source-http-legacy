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
    const git = await require('git-client').requireVersion('>=2.7.4');


    // fetch file tree
    const treeResponse = await hostApi.get('/emergence');
    const treeFiles = treeResponse.data.files;


    // build manifest
    const manifestWriter = await git.hashObject({  w: true, stdin: true, $spawn: true });

    for (const path of Object.keys(treeFiles).sort()) {
        manifestWriter.stdin.write(treeFiles[path].SHA1 + ' ' + path + '\n');
    }

    manifestWriter.stdin.end();

    const manifestHash = (await manifestWriter.captureOutput()).trim();


    // let status = await git.status({ s: true, b: true });

    //let status = await git.status({ help: true });

    //logger.debug('git status:', status);
    // logger.info('git status:', await git.status());

    // logger.debug('getGitDirFromEnvironment:', await git.Git.getGitDirFromEnvironment());
    // logger.debug('getWorkTreeFromEnvironment:', await git.Git.getWorkTreeFromEnvironment());
};
