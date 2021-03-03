const { unused } = require("svcorelib");

const tr = require("../../translate");
const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const jokeCache = require("../../jokeCache");
const resolveIp = require("../../resolveIp");

// const settings = require("../../../settings");


/**
 * Clears the joke cache of the client that called this endpoint
 */
class ClearData extends SubmissionEndpoint {
    /**
     * Clears the joke cache of the client that called this endpoint
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "POST",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("clearJokeCache", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     * @param {string} data The raw data, as a string
     */
    async call(req, res, url, params, format, data)
    {
        unused(url, data);

        const lang = Endpoint.getLang(params);
        const ip = resolveIp(req);

        let statusCode = 200;
        let responseObj = {};


        try
        {
            const deletedEntries = await this.clearJokeCache(ip, lang);

            if(deletedEntries == 0)
            {
                responseObj = {
                    "error": false,
                    "jokeCache": {
                        "message": tr(lang, "jokeCacheClearNoEntries"),
                        "entriesDeleted": 0
                    },
                    "timestamp": new Date().getTime()
                };
            }
            else
            {
                responseObj = {
                    "error": false,
                    "jokeCache": {
                        "message": tr(lang, "jokeCacheCleared", deletedEntries.toString()),
                        "cacheEntriesDeleted": deletedEntries
                    },
                    "timestamp": new Date().getTime()
                };
            }
        }
        catch(err)
        {
            statusCode = 500;

            responseObj = {
                "error": true,
                "jokeCache": {
                    "message": err.toString(),
                    "cacheEntriesDeleted": 0
                },
                "timestamp": new Date().getTime()
            }
        }

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }

    //#MARKER clear methods

    /**
     * Clears the joke cache.  
     * Resolves with the amount of cleared entries, rejects with an error message
     * @param {string} ip The IP hash of the client
     * @param {string} [lang] Language code
     * @returns {number}
     */
    clearJokeCache(ip, lang)
    {
        return new Promise((pRes, pRej) => {
            jokeCache.cache.clearEntries(ip).then(amt => {
                return pRes(amt);
            }).catch(err => {
                return pRej(tr(lang, "jokeCacheClearError", err.toString()));
            });
        });
    }
}

module.exports = ClearData;
