const { unused } = require("svcorelib");

// const tr = require("../translate");
const Endpoint = require("../classes/Endpoint");

// const settings = require("../../../settings");


/** @typedef {import("http").IncomingMessage} IncomingMessage */
/** @typedef {import("http").ServerResponse} ServerResponse */

/**
 * Template for GET endpoints. These do not accept any data, they only return it.
 */
class TEMPLATE extends Endpoint {
    /**
     * Template for GET endpoints. These do not accept any data, they only return it.
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang",
                ],
            },
        };

        super("template", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {IncomingMessage} req The HTTP server request
     * @param {ServerResponse} res The HTTP server response
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


        responseObj = {
            "error": false,
            "template": "Hello, World!",
            "timestamp": Date.now(),
        };


        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = TEMPLATE;
