const { unused } = require("svcorelib");

const tr = require("../../translate");
const Endpoint = require("../../classes/Endpoint");
const FilterComponentEndpoint = require("../../classes/FilterComponentEndpoint");

const settings = require("../../../settings");


/**
 * Returns a list of supported response / file formats
 */
class Formats extends FilterComponentEndpoint {
    /**
     * Returns a list of supported response / file formats
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#formats-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang",
                ],
            },
        };

        super("formats", "formats", meta);
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

        let statusCode = 200;
        let responseObj = {};


        const descriptions = {};

        settings.jokes.possible.formats.forEach(format => {
            descriptions[format] = tr.getFilterComponentDescription(lang, "formats", format);
        });

        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "formats": settings.jokes.possible.formats,
                "descriptions": descriptions,
                "timestamp": Date.now(),
            };
        }
        else if(format == "xml")
        {
            responseObj = {
                "error": false,
                "formats": { "format": settings.jokes.possible.formats },
                "descriptions": { "description": descriptions },
                "timestamp": Date.now(),
            };
        }

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Formats;
