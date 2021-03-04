const { unused } = require("svcorelib");

const tr = require("../../translate");
const Endpoint = require("../../classes/Endpoint");


/**
 * Used for checking if the API is online or to test connection latency
 */
class Ping extends Endpoint {
    /**
     * Used for checking if the API is online or to test connection latency
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
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
     */
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        const data = {
            "error": false,
            "ping": tr(lang, "pingPong"),
            "timestamp": Date.now()
        };

        return Endpoint.respond(res, format, lang, data);
    }
}

module.exports = Ping;
