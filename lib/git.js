const logger = require('./logger');
const semver = require('semver');
const child_process = require('child_process');

/**
 * TODO:
 * - [ ] Port cliOptionsToArgs
 * - [ ] Add support for gitOptions
 */

/**
 * Represents and provides an interface to an executable git binary
 * available in the host environment
 */
class Git {

    constructor ({ command = 'git', gitDir = null, workTree = null} = {}) {
        this.command = command;
        this.gitDir = gitDir;
        this.workTree = workTree;

        this.version = null;
    }

    /**
     * Get the version of the hab binary
     * @returns {?string} Version reported by habitat binary, or null if not available
     */
    async getVersion () {
        if (this.version === null) {
            try {
                const output = await this.exec({ version: true });
                [, this.version] = /^git version (\d+\.\d+\.\d+)$/.exec(output);
            } catch (err) {
                this.version = false;
            }
        }

        return this.version || null;
    }

    /**
     * Check if habitat version is satisfied
     * @param {string} range - The version or range habitat should satisfy (see https://github.com/npm/node-semver#ranges)
     * @returns {boolean} True if habitat version satisfies provided range
     */
    async satisfiesVersion (range) {
        return semver.satisfies(await this.getVersion(), range);
    }


    /**
     * Executes git with given arguments
     * @param {string|string[]} args - Arguments to execute
     * @param {?Object} execOptions - Extra execution options
     * @returns {Promise}
     */
    async exec (...args) {
        const commandArgs = [];
        const commandEnv = {};
        const execOptions = {};

        logger.debug('building command', args);


        // scan through all arguments
        let arg;

        while (arg = args.shift()) {
            switch (typeof arg) {
                case 'string':
                case 'number':
                    commandArgs.push(arg.toString());
                    break;
                case 'object':

                    // extract any exec options
                    if ('$nullOnError' in arg) {
                        execOptions.nullOnError = arg.$nullOnError;
                        delete arg.$nullOnError;
                    }

                    if ('$env' in arg) {
                        for (let key in arg.$env) {
                            commandEnv[key] = arg.$options[key];
                        }
                        delete arg.$env;
                    }

                    if ('$preserveEnv' in arg) {
                        execOptions.preserveEnv = arg.$preserveEnv;
                        delete arg.$preserveEnv;
                    }

                    if ('$options' in arg) {
                        for (let key in arg.$options) {
                            execOptions[key] = arg.$options[key];
                        }
                    }

                    if ('$passthrough' in arg) {
                        if (execOptions.passthrough = Boolean(arg.$passthrough)) {
                            execOptions.spawn = true;
                        }
                        delete arg.$passthrough;
                    }

                    if ('$wait' in arg) {
                        execOptions.wait = Boolean(arg.$wait);
                        delete arg.$wait;
                    }


                    // any remaiing elements are args/options
                    for (let key in arg) {
                        const value = arg[key];

                        if (key.length == 1) {
                            if (value === true) {
                                commandArgs.push('-'+key);
                            } else if (value !== false) {
                                commandArgs.push('-'+key, value);
                            }
                        } else {
                            if (value === true) {
                                commandArgs.push('--'+key);
                            } else if (value !== false) {
                                commandArgs.push('--'+key, value);
                            }
                        }
                    }

                    break;
                default:
                    throw 'unhandled exec argument';
            }
        }


        // prepare options
        if (execOptions.preserveEnv !== false) {
            Object.setPrototypeOf(commandEnv, process.env);
        }

        execOptions.env = commandEnv;


        // execute git command
        logger.debug(this.command, commandArgs.join(' '));

        if (execOptions.spawn) {
            const process = child_process.spawn(this.command, commandArgs, execOptions);

            if (execOptions.passthrough) {
                process.stdout.on('data', data => data.toString().trim().split(/\n/).forEach(line => logger.info(line)));
                process.stderr.on('data', data => data.toString().trim().split(/\n/).forEach(line => logger.error(line)));
            }

            if (execOptions.wait) {
                return new Promise((resolve, reject) => {
                    process.on('exit', code => {
                        if (code == 0) {
                            resolve();
                        } else {
                            reject(code);
                        }
                    });
                });
            }

            return process;
        } else if (execOptions.shell) {
            return new Promise((resolve, reject) => {
                child_process.exec(`${this.command} ${commandArgs.join(' ')}`, execOptions, (error, stdout, stderr) => {
                    if (error) {
                        if (execOptions.nullOnError) {
                            return resolve(null);
                        } else {
                            error.stderr = stderr;
                            return reject(error);
                        }
                    }

                    resolve(stdout.trim());
                });
            });
        } else {
            return new Promise((resolve, reject) => {
                child_process.execFile(this.command, commandArgs, execOptions, (error, stdout, stderr) => {
                    if (error) {
                        if (execOptions.nullOnError) {
                            return resolve(null);
                        } else {
                            error.stderr = stderr;
                            return reject(error);
                        }
                    }

                    resolve(stdout.trim());
                });
            });
        }
    }
}

const git = new Git();

module.exports = function () {
    return git.exec.apply(git, arguments);
};

Object.setPrototypeOf(module.exports, git);

[
    'add',
    'bisect',
    'branch',
    'checkout',
    'clean',
    'clone',
    'commit',
    'config',
    'diff',
    'fetch',
    'grep',
    'init',
    'log',
    'merge',
    'mv',
    'pull',
    'push',
    'rebase',
    'reflog',
    'remote',
    'reset',
    'rm',
    'show',
    'stash',
    'status',
    'submodule',
    'tag',
].forEach(method => {
    Git.prototype[method] = function(...args) {
        args.unshift(method);
        return git.exec.apply(git, args);
    }
});