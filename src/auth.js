const http = require("http");
const scl = require("svcorelib");
const fs = require("fs-extra");

const exists = require("./exists");

const settings = require("../settings");

scl.unused([http]);


var tokenList;

/**
 * Initializes the auth module
 * @returns {Promise}
 */
function init()
{
    return new Promise(resolve => {
        exists(settings.auth.tokenListFile).then(exists => {
            if(!exists)
                fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));
            
            refreshTokens();

            let fd = new scl.FolderDaemon(settings.auth.tokenListFolder, [], false, settings.auth.daemonInterval * 1000)
            fd.onChanged((err, res) => {
                if(!err && res.length > 0)
                    refreshTokens();
            });

            return resolve();
        });
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
function authByHeader(req, res)
{
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
        token: requestersToken
    };
}

module.exports = { init, authByHeader };
