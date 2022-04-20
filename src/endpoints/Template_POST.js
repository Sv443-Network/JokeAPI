const { unused } = require("svcorelib");

// const tr = require("../translate");
const Endpoint = require("../classes/Endpoint");
const SubmissionEndpoint = require("../classes/SubmissionEndpoint");

// const settings = require("../../../settings");


/** @typedef {import("http").IncomingMessage} IncomingMessage */
/** @typedef {import("http").ServerResponse} ServerResponse */

/**
 * Template for POST / submission endpoints. These accept data.
 */
class TEMPLATE extends SubmissionEndpoint {
    /**
     * Template for POST / submission endpoints. These accept data.
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "POST",
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
     * @param {string} data The raw data, as a string
     */
    call(req, res, url, params, format, data)
    {
        unused(req, url, data);

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
