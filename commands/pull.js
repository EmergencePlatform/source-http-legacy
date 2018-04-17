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
        await pull(argv);
    } catch (err) {
        console.error('Failed to pull:', err);
        process.exit(1);
    }
};



async function pull (options) {
    const hostApi = await require('../lib/host.js').getApi(options);
    const git = await require('git-client').requireVersion('>=2.7.4');


    // fetch file tree
    logger.info('Downloading site manifest...');

    let treeResponse;
    try {
        treeResponse = await hostApi.get('/emergence');
    } catch (err) {
        logger.error('Failed to download manifest, got status %s %s', err.response.status, err.response.statusText);
        process.exit(2);
    }

    const treeFiles = treeResponse.data.files;
    const treePaths = Object.keys(treeFiles).sort();


    // organize paths into nested tree
    function TreeNode() {}
    const tree = Object.create(TreeNode);

    for (const treePath of treePaths) {
        let pathPart, pathParts = treePath.split('/');
        let parentNode = tree;

        while (pathPart = pathParts.shift()) {
            if (pathParts.length) {
                parentNode = parentNode[pathPart] || (parentNode[pathPart] = Object.create(TreeNode));
            } else {
                parentNode[pathPart] = treeFiles[treePath];
            }
        }
    }

    // TreeNode.isPrototypeOf(tree['site-root']) // true
    // TreeNode.isPrototypeOf(tree['site-root']['alerts.php']) // false


    // build manifest
    // const manifestWriter = await git.hashObject({  w: true, stdin: true, $spawn: true });

    // for (const treePath of treePaths) {
    //     manifestWriter.stdin.write(treeFiles[treePath].SHA1 + ' ' + treePath + '\n');
    // }

    // manifestWriter.stdin.end();

    // const manifestHash = (await manifestWriter.captureOutput()).trim();

    // TODO: diff manifest against last manifest and filter identical lines

    // download all files to git // TODO: allow X to run in parallel if hash-object is cool with that?
    for (let i = 0, treeLength = treePaths.length; i < treeLength; i++) {
        const treePath = treePaths[i];
        const rawHash = treeFiles[treePath].SHA1;
        const blobRef = `refs/sha1-blobs/${rawHash.substr(0, 2)}/${rawHash.substr(2)}`;

        let gitHash;

        try {
            gitHash = await git.showRef({ hash: true, verify: true }, blobRef);
            logger.info('(%s/%s) Existing blob %s for %s', i+1, treeLength, gitHash, treePath);
        } catch (err) {
            logger.info('(%s/%s) Downloading %s', i+1, treeLength, treePath);

            // create git writer and host reader
            const writer = await git.hashObject({  w: true, stdin: true, $spawn: true });
            const response = await hostApi.get(`/emergence/${treePath}`, { responseType: 'stream' });

            // pipe data from HTTP response into git
            response.data.pipe(writer.stdin);

            // wait for data to finish
            await new Promise((resolve, reject) => {
                response.data.on('end', () => resolve());
                response.data.on('error', () => reject());
            });

            // read written hash and save to ref
            gitHash = (await writer.captureOutput()).trim();

            // write mapping of emergence raw SHA1 hash to git hash
            const updateRefOutput = await git.updateRef(blobRef, gitHash);
        }
    }

};
