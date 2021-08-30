const { unused } = require("svcorelib");

const { getSplash } = require("../../splashes");
const Endpoint = require("../../classes/Endpoint");


/**
 * Used for checking if the API is online or to test connection latency
 */
class Ping extends Endpoint
{
    /**
     * Used for checking if the API is online or to test connection latency
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#ping-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("ping", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     * @param {httpServer.HttpMetrics} httpMetrics
     */
    call(req, res, url, params, format, httpMetrics)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        const now = Date.now();

        const data = {
            "error": false,
            "ping": getSplash(lang),
            "serverLatency": (now - httpMetrics.requestArrival.getTime()),
            "timestamp": now
        };

        return Endpoint.respond(res, format, lang, data);
    }
}

module.exports = Ping;
