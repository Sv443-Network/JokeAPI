const { unused } = require("svcorelib");

const tr = require("../../translate");
const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const jokeCache = require("../../jokeCache");
const resolveIp = require("../../resolveIP");

// const settings = require("../../../settings");


/**
 * Clears all collected data of the client that called this endpoint
 */
class ClearData extends SubmissionEndpoint
{
    /**
     * Clears all collected data of the client that called this endpoint
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
            },
            acceptsEmptyBody: true
        };

        super("cleardata", meta);
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
                        "entriesFound": false,
                        "entriesDeleted": 0
                    },
                    "timestamp": Date.now()
                };
            }
            else
            {
                responseObj = {
                    "error": false,
                    "jokeCache": {
                        "message": tr(lang, "jokeCacheCleared", deletedEntries.toString()),
                        "entriesFound": true,
                        "cacheEntriesDeleted": deletedEntries
                    },
                    "timestamp": Date.now()
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
                    "entriesFound": false,
                    "cacheEntriesDeleted": 0
                },
                "timestamp": Date.now()
            }
        }
        finally
        {
            Endpoint.respond(res, format, lang, responseObj, statusCode);
        }
    }

    //#MARKER clear methods

    /**
     * Clears the joke cache.  
     * Resolves with the amount of cleared entries, rejects with an error message
     * @param {string} ip The IP hash of the client
     * @param {string} [lang] Language code
     * @returns {Promise<number, string>}
     */
    clearJokeCache(ip, lang)
    {
        return new Promise(async (pRes, pRej) => {
            try
            {
                const amt = await jokeCache.cacheInstance.clearEntries(ip);
                return pRes(amt);
            }
            catch(err)
            {
                return pRej(tr(lang, "jokeCacheClearError", err.toString()));
            }
        });
    }
}

module.exports = ClearData;
