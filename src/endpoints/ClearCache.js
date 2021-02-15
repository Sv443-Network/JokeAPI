const { unused } = require("svcorelib");

const tr = require("../translate");
const Endpoint = require("../classes/Endpoint");

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
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        let statusCode = 200;
        let responseObj = {};


        // TODO: clear cache
        

        responseObj = {
            "error": false,
            "message": tr(lang, "jokeCacheCleared")
        };
        

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = ClearJokeCache;
