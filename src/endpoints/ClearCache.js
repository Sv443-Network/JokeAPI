const { unused } = require("svcorelib");

const tr = require("../translate");
const Endpoint = require("../classes/Endpoint");
const jokeCache = require("../jokeCache");
const resolveIp = require("../resolveIp");

const settings = require("../../settings");


/**
 * Clears the joke cache of the client that called this endpoint
 */
class ClearJokeCache extends Endpoint {
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
     */
    async call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);
        const ip = resolveIp(req);

        let statusCode = 200;
        let responseObj = {};


        try
        {
            const deletedEntries = await jokeCache.cache.clearEntries(ip);

            if(deletedEntries == 0)
            {
                responseObj = {
                    "error": false,
                    "message": tr(lang, "jokeCacheClearNoEntries"),
                    "entriesDeleted": 0,
                    "timestamp": new Date().getTime()
                };
            }
            else
            {
                responseObj = {
                    "error": false,
                    "message": tr(lang, "jokeCacheCleared", deletedEntries.toString()),
                    "entriesDeleted": deletedEntries,
                    "timestamp": new Date().getTime()
                };
            }
        }
        catch(err)
        {
            statusCode = 500;

            responseObj = {
                "error": true,
                "message": tr(lang, "jokeCacheClearError", err.toString()),
                "entriesDeleted": 0,
                "timestamp": new Date().getTime()
            }
        }


        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = ClearJokeCache;
