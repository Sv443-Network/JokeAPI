const http = require("http");
const jsl = require("svjsl");
const fs = require("fs-extra");
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
 * @typedef {Object} Authorization
 * @prop {Boolean} isAuthorized
 * @prop {String} token
 */

/**
 * Checks if the requester has provided an auth header and if the auth header is valid
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} [res] If not provided, users will not get the `Token-Valid` response header
 * @returns {Authorization}
 */
const authByHeader = (req, res) => {
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

        if(res && typeof res.setHeader == "function")
            res.setHeader(settings.auth.tokenValidHeader, (isAuthorized ? "1" : "0"));
    }

    return {
        isAuthorized: isAuthorized,
        token: requestersToken
    };
};

module.exports = { init, authByHeader };
