const http = require("http");
const jsl = require("svjsl");
const fs = require("fs");
const settings = require("../settings");

jsl.unused([http]);




const init = () => {
    return new Promise(resolve => {
        fs.exists(settings.auth.tokenListFile, exists => {
            if(!exists)
                fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
            
            try
            {
                let tokens = JSON.parse(fs.readFileSync(settings.auth.tokenListFile).toString());
                process._tokenList = tokens;
                return resolve();
            }
            catch(err)
            {
                process._tokenList = [];
                fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
                return resolve();
            }
        });
    });
};

/**
 * Checks if the requester has provided an auth header and if the auth header is valid
 * @param {http.IncomingMessage} req 
 * @returns {Object}
 */
const authByHeader = (req) => {
    let isAuthorized = false;
    let requestersToken = "";

    if(req.headers && req.headers[settings.auth.tokenHeaderName])
    {
        if(Array.isArray(process._tokenList) && process._tokenList.length > 0)
        {
            process._tokenList.forEach(tokenObj => {
                if(tokenObj.token == req.headers[settings.auth.tokenHeaderName].toString())
                {
                    requestersToken = req.headers[settings.auth.tokenHeaderName].toString();
                    isAuthorized = true;
                }
            });
        }
    }

    return {
        isAuthorized: isAuthorized,
        token: requestersToken
    };
};

module.exports = { init, authByHeader };