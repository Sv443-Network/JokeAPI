const http = require("http");
const { filesystem, unused, FolderDaemon } = require("svcorelib");
const fs = require("fs-extra");

const settings = require("../settings");

unused(http);

/**
 * @typedef {object} TokenObj
 * @prop {string} token
 * @prop {number|null} maxReqs
 */

/**
 * @typedef {object} TokenAuthorizationResult
 * @prop {boolean} isAuthorized
 * @prop {string} token
 */


/** @type {TokenObj[]} */
let tokenList = [];


/**
 * Initializes the auth module
 * @returns {Promise}
 */
function init()
{
    return new Promise(async resolve => {
        if(!(await filesystem.exists(settings.auth.tokenListFile)))
            fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));

        refreshTokens();

        let fd = new FolderDaemon(settings.auth.tokenListFolder, [], false, settings.auth.daemonInterval * 1000)
        fd.onChanged((err, res) => {
            if(!err && res.length > 0)
                refreshTokens();
        });

        return resolve();
    });
}

// prevoius code in case of an emergency (call on interval in init(), after exists() callback)
// /**
//  * To be called on interval to check if the tokens should be refreshed
//  */
// function daemonInterval()
// {
//     let tokenFileRaw = fs.readFileSync(settings.auth.tokenListFile).toString();
//     let tokenHash = crypto.createHash("md5").update(tokenFileRaw).digest("hex");

//     if(previousDaemonHash == undefined)
//         return;
//     else if(previousDaemonHash != tokenHash)
//     {
//         previousDaemonHash = tokenHash;
//         refreshTokens();
//     }
// }

/**
 * Refreshes the auth tokens in memory
 */
function refreshTokens()
{
    try
    {
        const tokens = JSON.parse(fs.readFileSync(settings.auth.tokenListFile).toString());
        tokenList = tokens;
    }
    catch(err)
    {
        tokenList = [];
        fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
    }
}

/**
 * Checks if the requester has provided an auth header and if the auth header is valid
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} [res] If not provided, users will not get the `Token-Valid` response header
 * @returns {TokenAuthorizationResult}
 */
function authByHeader(req, res)
{
    try
    {
        let isAuthorized = false;
        let requestersToken = "";

        const authHeader = req.headers[settings.auth.tokenHeaderName].toString();

        if(req.headers && authHeader)
        {
            if(Array.isArray(tokenList) && tokenList.length > 0)
            {
                // skip through if client is already authorized
                if(isAuthorized)
                    return;

                tokenList.forEach(tokenObj => {
                    const { token } = tokenObj;

                    const clientToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.substr(7) : authHeader;

                    if(token === clientToken)
                    {
                        requestersToken = clientToken;
                        isAuthorized = true;
                    }
                });
            }

            if(res && typeof res.setHeader === "function")
                res.setHeader(settings.auth.tokenValidHeader, (isAuthorized ? "1" : "0"));
        }

        return {
            isAuthorized: isAuthorized,
            token: requestersToken
        };
    }
    catch(err)
    {
        return {
            isAuthorized: false,
            token: ""
        };
    }
}

module.exports = { init, authByHeader };
