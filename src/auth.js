const http = require("http");
const jsl = require("svjsl");
const fs = require("fs-extra");
const crypto = require("crypto");
const settings = require("../settings");

jsl.unused([http]);


var previousDaemonHash;
var tokenList;

/**
 * Initializes the auth module
 */
const init = () => {
    return new Promise(resolve => {
        fs.exists(settings.auth.tokenListFile, exists => {
            if(!exists)
                fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
            
            refreshTokens();
            setInterval(() => daemonInterval(), settings.auth.daemonInterval);
            return resolve();
        });
    });
};

/**
 * To be called on interval to check if the tokens should be refreshed
 */
function daemonInterval()
{
    let tokenFileRaw = fs.readFileSync(settings.auth.tokenListFile).toString();
    let tokenHash = crypto.createHash("md5").update(tokenFileRaw).digest("hex");

    if(previousDaemonHash == undefined)
        return;
    else if(previousDaemonHash != tokenHash)
    {
        previousDaemonHash = tokenHash;
        refreshTokens();
    }
}

/**
 * Refreshes the auth tokens in memory
 */
function refreshTokens()
{
    try
    {
        let tokens = JSON.parse(fs.readFileSync(settings.auth.tokenListFile).toString());
        tokenList = tokens;
    }
    catch(err)
    {
        tokenList = [];
        fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
    }
}

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
        if(Array.isArray(tokenList) && tokenList.length > 0)
        {
            tokenList.forEach(tokenObj => {
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
        token: requestersToken,
    };
};

module.exports = { init, authByHeader };
