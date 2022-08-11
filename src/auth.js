const { files, FolderDaemon } = require("svcorelib");
const { ServerResponse } = require("http");
const fs = require("fs-extra");

const settings = require("../settings");

//#MARKER types

/** @typedef {import("http").IncomingMessage} IncomingMessage */
/** @typedef {import("./types/auth").TokenObj} TokenObj */
/** @typedef {import("./types/auth").TokenAuthorizationResult} TokenAuthorizationResult */

//#MARKER semi-globals

/** @type {TokenObj[]} */
let tokenList = [];

//#MARKER auth

/**
 * Initializes the auth module
 * @returns {Promise<void>}
 */
function init()
{
    return new Promise(async resolve => {
        if(!(await files.exists(settings.auth.tokenListFile)))
            fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify([], null, 4));

        refreshTokens();

        const fd = new FolderDaemon(settings.auth.tokenListFolder, [], false, settings.auth.daemonInterval * 1000);

        fd.onChanged((err, res) => {
            if(!err && res.length > 0)
                refreshTokens();
        });

        return resolve();
    });
}

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
 * @param {IncomingMessage} req 
 * @param {ServerResponse} [res] If not provided, users will not get the `Token-Valid` response header
 * @returns {TokenAuthorizationResult}
 */
function authByHeader(req, res)
{
    try
    {
        let isAuthorized = false;
        let requestersToken = "";

        const authHeader = (req.headers && req.headers["authorization"]) ? req.headers["authorization"].toString() : null;

        if(req.headers && typeof authHeader === "string")
        {
            if(Array.isArray(tokenList) && tokenList.length > 0)
            {
                // skip through if client is already authorized
                if(isAuthorized)
                    return;

                tokenList.forEach(tokenObj => {
                    const { token } = tokenObj;

                    const clientToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.substring(7) : authHeader;

                    if(token === clientToken)
                    {
                        requestersToken = clientToken;
                        isAuthorized = true;
                    }
                });
            }

            if(res instanceof ServerResponse)
                res.setHeader("Token-Valid", (isAuthorized ? "1" : "0"));
        }

        return {
            isAuthorized: isAuthorized,
            token: requestersToken,
        };
    }
    catch(err)
    {
        return {
            isAuthorized: false,
            token: "",
        };
    }
}

module.exports = { init, authByHeader };
