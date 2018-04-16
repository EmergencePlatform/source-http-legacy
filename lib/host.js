const logger = require('./logger.js');

module.exports.getApi = async ({
    host,
    token,
    key,
    username, password
}) => {

    // initialize common request configuration
    const hostOptions = {
        baseURL: `http://${host}`,
        validateStatus: status => status == 200 || status == 300
    };


    // apply authentication
    if (token) {
        hostOptions.headers = {
            Authorization: 'Token '+token
        };
    } else if (key) {
        hostOptions.params = {
            accessKey: key
        };
    } else {
        const prompts = [];

        // prompt interactively for username and/or password if not provided
        if (!username) {
            prompts.push({
                name: 'username',
                message: 'Developer username:'
            });
        }

        if (!password) {
            prompts.push({
                name: 'password',
                message: 'Developer password:',
                type: 'password'
            });
        }

        if (prompts.length) {
            ({ username = username, password = password } = await require('inquirer').prompt(prompts));
        }

        hostOptions.params = {
            '_LOGIN[username]': username,
            '_LOGIN[password]': password
        };
    }


    // return axios instance
    return require('axios').create(hostOptions);
};